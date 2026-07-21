import { Link } from 'react-router-dom'

type HeaderProps = {
  admin?: boolean
  showLogin?: boolean
}

const Header = ({ admin = false, showLogin = false }: HeaderProps) => (
  <header className={`header${admin ? ' header--admin' : ''}`}>
    <div>
      <Link className="header__logo" to={admin ? '/admin' : '/'}>
        Идём<span>в</span>кино
      </Link>
      {admin && <p className="header__subtitle">Администраторская</p>}
    </div>
    {!admin && showLogin && (
      <Link className="button button--login" to="/admin/login">
        Войти
      </Link>
    )}
  </header>
)

export default Header
