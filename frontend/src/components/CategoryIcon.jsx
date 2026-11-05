import {
  BookMarked,
  BriefcaseBusiness,
  Code2,
  Cpu,
  FlaskConical,
  GraduationCap,
  Library,
  Palette,
  Sigma,
} from 'lucide-react'

const ICONS = {
  COMPUTER_SCIENCE: Code2,
  ENGINEERING: Cpu,
  BUSINESS: BriefcaseBusiness,
  SCIENCE: FlaskConical,
  MATHEMATICS: Sigma,
  LITERATURE: BookMarked,
  ARTS_DESIGN: Palette,
  COMPETITIVE_EXAMS: GraduationCap,
  OTHER: Library,
}

export default function CategoryIcon({ category, size = 20, ...props }) {
  const Icon = ICONS[category] || Library
  return <Icon size={size} aria-hidden="true" {...props} />
}
