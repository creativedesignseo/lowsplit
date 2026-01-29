-- Tipos de transacciones y estados
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'purchase', 'withdrawal', 'refund');
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de Billeteras (una por perfil)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Tabla de Transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'completed' NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- Los usuarios solo ven su propia billetera
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = id);

-- Los usuarios solo ven sus propias transacciones
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = wallet_id);

-- Función para crear billetera automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.wallets (id, balance)
    VALUES (new.id, 0.00)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para perfiles nuevos
DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- Función Atómica para manejar la recarga de billetera (RPC)
CREATE OR REPLACE FUNCTION public.handle_wallet_topup(
    p_user_id UUID,
    p_amount DECIMAL,
    p_stripe_id TEXT,
    p_description TEXT DEFAULT 'Recarga de saldo via Stripe'
)
RETURNS VOID AS $$
BEGIN
    -- 1. Incrementar saldo en la billetera
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_user_id;

    -- 2. Registrar la transacción en el historial de la billetera (Lógica interna)
    INSERT INTO public.transactions (wallet_id, amount, type, status, description)
    VALUES (p_user_id, p_amount, 'deposit', 'completed', p_description);

    -- 3. Registrar en payment_transactions (Auditoría externa/Stripe)
    INSERT INTO public.payment_transactions (user_id, amount, currency, status, stripe_payment_intent_id)
    VALUES (p_user_id, p_amount, 'EUR', 'completed', p_stripe_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_join_group_wallet(
    p_user_id UUID,
    p_group_id UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT 'Pago de suscripción'
)
RETURNS VOID AS $$
DECLARE
    v_slots_occupied INT;
    v_max_slots INT;
    v_balance DECIMAL;
    v_membership_id UUID;
BEGIN
    -- 1. Verificar si ya es miembro
    IF EXISTS (SELECT 1 FROM public.memberships WHERE group_id = p_group_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'Ya eres miembro de este grupo';
    END IF;

    -- 2. Verificar slots disponibles
    SELECT slots_occupied, max_slots INTO v_slots_occupied, v_max_slots
    FROM public.subscription_groups
    WHERE id = p_group_id
    FOR UPDATE;

    IF v_slots_occupied >= v_max_slots THEN
        RAISE EXCEPTION 'El grupo ya está lleno';
    END IF;

    -- 3. Verificar saldo del usuario
    SELECT balance INTO v_balance
    FROM public.wallets
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente en tu billetera. Necesitas €%, pero tienes €%', p_amount, v_balance;
    END IF;

    -- 4. Descontar saldo
    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_user_id;

    -- 5. Registrar transacción en billetera (Historial interno de Billetera)
    INSERT INTO public.transactions (wallet_id, amount, type, status, description)
    VALUES (p_user_id, p_amount, 'purchase', 'completed', p_description);

    -- 6. Crear membresía
    INSERT INTO public.memberships (group_id, user_id, role, payment_status, last_payment_at)
    VALUES (p_group_id, p_user_id, 'member', 'paid', now())
    RETURNING id INTO v_membership_id;

    -- 7. Registrar en payment_transactions (Historial centralizado de Pedidos)
    INSERT INTO public.payment_transactions (user_id, membership_id, amount, currency, status, stripe_payment_intent_id)
    VALUES (p_user_id, v_membership_id, p_amount, 'EUR', 'completed', 'wallet_balance');

    -- 8. Actualizar slots del grupo y estado
    UPDATE public.subscription_groups
    SET slots_occupied = slots_occupied + 1,
        status = CASE WHEN slots_occupied + 1 >= v_max_slots THEN 'full' ELSE 'available' END,
        updated_at = now()
    WHERE id = p_group_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
