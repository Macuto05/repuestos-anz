import { Hero } from "@/components/home/Hero"
import { CategoryGrid } from "@/components/home/CategoryGrid"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <CategoryGrid />
    </div>
  )
}
