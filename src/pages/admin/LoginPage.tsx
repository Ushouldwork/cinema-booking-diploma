import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cinemaApi } from '../../api/CinemaApi'
import '../../assets/styles/admin.css'
import Header from '../../components/common/Header'

const LoginPage = () => {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      await cinemaApi.login(login, password)
      sessionStorage.setItem('cinema-admin', 'true')
      navigate('/admin')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--admin">
      <Header admin />
      <main className="login-card">
        <h1>Авторизация</h1>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input type="email" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="example@domain.xyz" required />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button admin-button" type="submit" disabled={loading}>
            {loading ? 'Проверяем…' : 'Авторизоваться'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default LoginPage
