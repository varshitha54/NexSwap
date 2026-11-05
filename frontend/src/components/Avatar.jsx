import { getInitials } from '../utils/format'

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      className={`avatar avatar--${size} ${className}`}
      title={name}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
    >
      {getInitials(name)}
    </span>
  )
}
