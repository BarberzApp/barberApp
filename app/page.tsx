import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">Professional Barber Services</h1>
            <p className="text-muted-foreground md:text-xl max-w-[700px]">
              Experience premium haircuts and grooming services from our expert barbers.
            </p>

            <div className="w-full max-w-2xl relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for services or barbers"
                className="pl-10 h-12 text-base rounded-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button asChild size="lg" className="flex-1 rounded-full">
                <Link href="/book">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Appointment
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 rounded-full">
                <Link href="/services">
                  <Clock className="mr-2 h-5 w-5" />
                  View Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">${service.price}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/book?service=${service.id}`}>Book Now</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold">Visit Us</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>123 Barber Street, Downtown, City</span>
            </div>
            <Button asChild variant="outline">
              <Link href="/location">Get Directions</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

const services = [
  {
    id: "1",
    name: "Classic Haircut",
    description: "Traditional haircut with clippers and scissors",
    price: "30",
  },
  {
    id: "2",
    name: "Beard Trim",
    description: "Professional beard shaping and trimming",
    price: "20",
  },
  {
    id: "3",
    name: "Haircut & Beard",
    description: "Complete grooming package",
    price: "45",
  },
  {
    id: "4",
    name: "Kids Haircut",
    description: "Specialized cuts for children",
    price: "25",
  },
  {
    id: "5",
    name: "Senior Haircut",
    description: "Specialized cuts for seniors",
    price: "25",
  },
  {
    id: "6",
    name: "Design Cut",
    description: "Creative and artistic haircut designs",
    price: "40",
  },
]
