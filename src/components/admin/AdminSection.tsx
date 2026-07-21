import type { ReactNode } from 'react'

type AdminSectionProps = {
  title: string
  children: ReactNode
}

const AdminSection = ({ title, children }: AdminSectionProps) => (
  <section className="admin-section">
    <h2 className="admin-section__title">{title}</h2>
    <div className="admin-section__body">{children}</div>
  </section>
)

export default AdminSection
