import { type ReactNode, useEffect } from 'react'

type AdminModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
}

const AdminModal = ({ title, children, onClose }: AdminModalProps) => {
  useEffect(() => {
    const closeByEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeByEscape)
    document.body.classList.add('has-modal')

    return () => {
      document.removeEventListener('keydown', closeByEscape)
      document.body.classList.remove('has-modal')
    }
  }, [onClose])

  return (
    <div className="admin-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="admin-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <header className="admin-modal__header">
          <h2 id="admin-modal-title">{title}</h2>
          <button type="button" aria-label="Закрыть окно" onClick={onClose}>×</button>
        </header>
        <div className="admin-modal__body">{children}</div>
      </section>
    </div>
  )
}

export default AdminModal
