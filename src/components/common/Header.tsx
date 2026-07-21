import { Link } from 'react-router-dom'

type HeaderProps = {
  admin?: boolean
}

const Header = ({ admin = false }: HeaderProps) => (
  <header className="header">
    <div>
      <Link className="header__logo" to={admin ? '/admin' : '/'}>
        Идём<span>в</span>кино
      </Link>
      {admin && <p className="header__subtitle">Администраторская</p>}
    </div>
    {!admin && (
      <Link className="button button--login" to="/admin/login">
        Войти
      </Link>
    )}
  </header>
)

export default Header
