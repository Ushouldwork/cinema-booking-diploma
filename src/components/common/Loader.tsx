type LoaderProps = {
  text?: string
}

const Loader = ({ text = 'Загрузка…' }: LoaderProps) => (
  <div className="status-message" role="status">
    <span className="status-message__spinner" aria-hidden="true" />
    <span>{text}</span>
  </div>
)

export default Loader
