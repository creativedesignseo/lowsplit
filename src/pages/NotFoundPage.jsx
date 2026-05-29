import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>404 — LowSplit</title>
      </Helmet>

      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-7xl font-extrabold text-primary-500">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mt-2 max-w-md">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </>
  )
}

export default NotFoundPage
