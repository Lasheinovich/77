"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Award, Clock, Users, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LearnPage() {
  const { t } = useTranslation()

  // Mock courses data
  const courses = [
    {
      id: 1,
      title: "Introduction to AI",
      description: "Learn the fundamentals of artificial intelligence",
      image: "/placeholder.svg?height=200&width=300&query=AI%20Introduction",
      level: "Beginner",
      duration: "4 weeks",
      students: 1245,
      rating: 4.8,
      progress: 0,
    },
    {
      id: 2,
      title: "Machine Learning Fundamentals",
      description: "Master the core concepts of machine learning",
      image: "/placeholder.svg?height=200&width=300&query=Machine%20Learning",
      level: "Intermediate",
      duration: "6 weeks",
      students: 987,
      rating: 4.7,
      progress: 0,
    },
    {
      id: 3,
      title: "Deep Learning Specialization",
      description: "Advanced deep learning techniques and applications",
      image: "/placeholder.svg?height=200&width=300&query=Deep%20Learning",
      level: "Advanced",
      duration: "8 weeks",
      students: 654,
      rating: 4.9,
      progress: 0,
    },
    {
      id: 4,
      title: "Natural Language Processing",
      description: "Understanding and implementing NLP techniques",
      image: "/placeholder.svg?height=200&width=300&query=NLP",
      level: "Intermediate",
      duration: "5 weeks",
      students: 876,
      rating: 4.6,
      progress: 0,
    },
    {
      id: 5,
      title: "Computer Vision",
      description: "Image recognition and processing with AI",
      image: "/placeholder.svg?height=200&width=300&query=Computer%20Vision",
      level: "Advanced",
      duration: "7 weeks",
      students: 543,
      rating: 4.8,
      progress: 0,
    },
    {
      id: 6,
      title: "AI Ethics and Governance",
      description: "Ethical considerations in AI development and deployment",
      image: "/placeholder.svg?height=200&width=300&query=AI%20Ethics",
      level: "All Levels",
      duration: "3 weeks",
      students: 1098,
      rating: 4.9,
      progress: 0,
    },
  ]

  // Mock learning paths
  const learningPaths = [
    {
      id: 1,
      title: "AI Developer Path",
      description: "Become a proficient AI developer",
      courses: [1, 2, 3],
      level: "Beginner to Advanced",
      duration: "18 weeks",
    },
    {
      id: 2,
      title: "Data Scientist Path",
      description: "Master data science and analytics",
      courses: [2, 4, 5],
      level: "Intermediate to Advanced",
      duration: "20 weeks",
    },
    {
      id: 3,
      title: "AI Ethics Specialist",
      description: "Specialize in AI ethics and governance",
      courses: [1, 6],
      level: "All Levels",
      duration: "7 weeks",
    },
  ]

  // Mock enrolled courses with progress
  const enrolledCourses = [
    {
      ...courses[0],
      progress: 75,
    },
    {
      ...courses[2],
      progress: 30,
    },
  ]

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">DAR Al-Hikmah AI School</h1>
          <p className="text-muted-foreground mt-2">{t("ai_school")} - Personalized learning paths for AI education</p>
        </div>
      </div>

      <Tabs defaultValue="enrolled" className="mb-8">
        <TabsList>
          <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          <TabsTrigger value="courses">All Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-6">
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="aspect-video w-full relative">
                    <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge>{course.level}</Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="mr-1 h-4 w-4 text-yellow-500" />
                        {course.rating}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Continue Learning</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No enrolled courses</h3>
              <p className="mt-2 text-muted-foreground">Browse our courses and start learning today</p>
              <Button className="mt-4" asChild>
                <Link href="#courses">Browse Courses</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="aspect-video w-full relative">
                  <Image src={course.image || "/placeholder.svg"} alt={course.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{course.title}</CardTitle>
                    <Badge>{course.level}</Badge>
                  </div>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-4 w-4" />
                      {course.students}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="mr-1 h-4 w-4 text-yellow-500" />
                      {course.rating}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Enroll Now</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <Card key={path.id}>
                <CardHeader>
                  <CardTitle>{path.title}</CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Level:</span>
                      <span className="text-sm text-muted-foreground">{path.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Duration:</span>
                      <span className="text-sm text-muted-foreground">{path.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Courses:</span>
                      <span className="text-sm text-muted-foreground">{path.courses.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Path</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No certificates yet</h3>
            <p className="mt-2 text-muted-foreground">Complete courses to earn certificates</p>
            <Button className="mt-4" asChild>
              <Link href="#courses">Browse Courses</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
