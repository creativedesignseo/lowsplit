-- Wallet System for LowSplit
-- Phase 1: Basic wallet with balance and transaction history

-- User Wallets Table
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  pending_balance DECIMAL(10,2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earning', 'purchase', 'withdrawal', 'topup', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference membership_id, payment_transaction_id, etc.
  reference_type TEXT, -- 'membership', 'payment', etc.
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

-- Row Level Security
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for user_wallets
CREATE POLICY "Users can view own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet" ON user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallet" ON user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create wallet for new users (trigger on profile creation)
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create wallet
DROP TRIGGER IF EXISTS on_profile_created_create_wallet ON profiles;
CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Function to add earnings to wallet (called when membership payment is received)
CREATE OR REPLACE FUNCTION add_wallet_earning(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Insert transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (p_user_id, 'earning', p_amount, p_description, p_reference_id, 'membership')
  RETURNING id INTO v_transaction_id;
  
  -- Update wallet balance
  INSERT INTO user_wallets (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_wallets.balance + p_amount,
    total_earned = user_wallets.total_earned + p_amount,
    updated_at = now();
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
