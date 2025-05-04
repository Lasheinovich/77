"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/hooks/use-translation"
import { ErrorBoundary } from "@/components/error-boundary"
import { AppLayout } from "@/components/layout/app-layout"
import {
  MessageSquare,
  Users,
  Calendar,
  Heart,
  Share2,
  BookOpen,
  Award,
  ThumbsUp,
  Send,
  Filter,
  Search,
  Plus,
  Clock,
  Tag,
  X,
} from "lucide-react"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { withErrorTracking } from "@/lib/error-tracking"
import Link from "next/link"
import { Label } from "@/components/ui/label"

interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    role?: string
  }
  category: string
  tags: string[]
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
  isLiked?: boolean
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    role?: string
  }
  createdAt: string
  likes: number
  isLiked?: boolean
}

export default function CommunityPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState("general")
  const [newPostTags, setNewPostTags] = useState("")
  const [newComment, setNewComment] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("discussions")
  const [activeFilter, setActiveFilter] = useState("latest")

  // Fetch posts
  const fetchPosts = withErrorTracking(async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use mock data
      const { data, error } = await db.from("community_posts").select("*").order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setPosts(
          data.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: {
              id: post.author_id,
              name: post.author_name,
              avatar: post.author_avatar,
              role: post.author_role,
            },
            category: post.category,
            tags: post.tags || [],
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            isLiked: post.is_liked || false,
          })),
        )
      }
    } catch (error) {
      logger.error("Failed to fetch posts", { error })
      toast({
        title: t("error"),
        description: t("failed_to_fetch_posts"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  })

  // Fetch comments for a post
  const fetchComments = withErrorTracking(async (postId: string) => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use mock data
      const { data, error } = await db
        .from("community_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (data) {
        setComments(
          data.map((comment) => ({
            id: comment.id,
            content: comment.content,
            author: {
              id: comment.author_id,
              name: comment.author_name,
              avatar: comment.author_avatar,
              role: comment.author_role,
            },
            createdAt: comment.created_at,
            likes: comment.likes_count || 0,
            isLiked: comment.is_liked || false,
          })),
        )
      }
    } catch (error) {
      logger.error("Failed to fetch comments", { error, postId })
      toast({
        title: t("error"),
        description: t("failed_to_fetch_comments"),
        variant: "destructive",
      })
    }
  })

  // Create a new post
  const createPost = withErrorTracking(async () => {
    if (!user) {
      toast({
        title: t("error"),
        description: t("login_required"),
        variant: "destructive",
      })
      return
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: t("error"),
        description: t("title_and_content_required"),
        variant: "destructive",
      })
      return
    }

    try {
      const tags = newPostTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const { data, error } = await db
        .from("community_posts")
        .insert({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
          tags,
          author_id: user.id,
          author_name: user.name || user.email,
          author_avatar: user.avatar,
          author_role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        const newPost: Post = {
          id: data[0].id,
          title: data[0].title,
          content: data[0].content,
          author: {
            id: data[0].author_id,
            name: data[0].author_name,
            avatar: data[0].author_avatar,
            role: data[0].author_role,
          },
          category: data[0].category,
          tags: data[0].tags || [],
          likes: 0,
          comments: 0,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
        }

        setPosts([newPost, ...posts])
        setNewPostTitle("")
        setNewPostContent("")
        setNewPostCategory("general")
        setNewPostTags("")

        toast({
          title: t("success"),
          description: t("post_created_successfully"),
        })
      }
    } catch (error) {
      logger.error("Failed to create post", { error })
      toast({
        title: t("error"),
        description: t("failed_to_create_post"),
        variant: "destructive",
      })
    }
  })

  // Create a new comment
  const createComment = withErrorTracking(async () => {
    if (!user) {
      toast({
        title: t("error"),
        description: t("login_required"),
        variant: "destructive",
      })
      return
    }

    if (!activePost) {
      toast({
        title: t("error"),
        description: t("no_active_post"),
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: t("error"),
        description: t("comment_required"),
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await db
        .from("community_comments")
        .insert({
          content: newComment,
          post_id: activePost.id,
          author_id: user.id,
          author_name: user.name || user.email,
          author_avatar: user.avatar,
          author_role: user.role,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        const newCommentObj: Comment = {
          id: data[0].id,
          content: data[0].content,
          author: {
            id: data[0].author_id,
            name: data[0].author_name,
            avatar: data[0].author_avatar,
            role: data[0].author_role,
          },
          createdAt: data[0].created_at,
          likes: 0,
        }

        setComments([...comments, newCommentObj])
        setNewComment("")

        // Update comment count in posts
        setPosts(posts.map((post) => (post.id === activePost.id ? { ...post, comments: post.comments + 1 } : post)))

        // Update active post
        if (activePost) {
          setActivePost({
            ...activePost,
            comments: activePost.comments + 1,
          })
        }

        toast({
          title: t("success"),
          description: t("comment_added_successfully"),
        })
      }
    } catch (error) {
      logger.error("Failed to create comment", { error })
      toast({
        title: t("error"),
        description: t("failed_to_add_comment"),
        variant: "destructive",
      })
    }
  })

  // Like a post
  const likePost = withErrorTracking(async (postId: string) => {
    if (!user) {
      toast({
        title: t("error"),
        description: t("login_required"),
        variant: "destructive",
      })
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const isCurrentlyLiked = post.isLiked

      // Optimistic update
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1,
              }
            : p,
        ),
      )

      if (activePost?.id === postId) {
        setActivePost({
          ...activePost,
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? activePost.likes - 1 : activePost.likes + 1,
        })
      }

      // Update in database
      if (isCurrentlyLiked) {
        await db.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
      } else {
        await db.from("community_post_likes").insert({
          post_id: postId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      logger.error("Failed to like post", { error, postId })
      toast({
        title: t("error"),
        description: t("failed_to_like_post"),
        variant: "destructive",
      })

      // Revert optimistic update
      fetchPosts()
    }
  })

  // Like a comment
  const likeComment = withErrorTracking(async (commentId: string) => {
    if (!user) {
      toast({
        title: t("error"),
        description: t("login_required"),
        variant: "destructive",
      })
      return
    }

    try {
      const comment = comments.find((c) => c.id === commentId)
      if (!comment) return

      const isCurrentlyLiked = comment.isLiked

      // Optimistic update
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? c.likes - 1 : c.likes + 1,
              }
            : c,
        ),
      )

      // Update in database
      if (isCurrentlyLiked) {
        await db.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
      } else {
        await db.from("community_comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      logger.error("Failed to like comment", { error, commentId })
      toast({
        title: t("error"),
        description: t("failed_to_like_comment"),
        variant: "destructive",
      })

      // Revert optimistic update
      if (activePost) {
        fetchComments(activePost.id)
      }
    }
  })

  // View a post
  const viewPost = (post: Post) => {
    setActivePost(post)
    fetchComments(post.id)
  }

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (activeFilter) {
      case "latest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "popular":
        return b.likes - a.likes
      case "most-commented":
        return b.comments - a.comments
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Load posts on mount
  useEffect(() => {
    fetchPosts()
  }, [])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("community")}</h1>
            <p className="text-muted-foreground">{t("community_description")}</p>
          </div>

          {user && (
            <Button onClick={() => setActiveTab("new-post")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("new_post")}
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="discussions" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{t("discussions")}</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t("events")}</span>
                </TabsTrigger>
                <TabsTrigger value="new-post" className="flex items-center gap-2 md:hidden">
                  <Plus className="h-4 w-4" />
                  <span>{t("new_post")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussions" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t("search_discussions")}
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      className="bg-background border rounded px-2 py-1 text-sm"
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                    >
                      <option value="latest">{t("latest")}</option>
                      <option value="popular">{t("popular")}</option>
                      <option value="most-commented">{t("most_commented")}</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-4 bg-muted rounded w-full mb-2"></div>
                          <div className="h-4 bg-muted rounded w-full mb-2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : sortedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {sortedPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => viewPost(post)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{post.title}</CardTitle>
                            <Badge variant="outline">{post.category}</Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.author.avatar} alt={post.author.name} />
                              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{post.author.name}</span>
                            {post.author.role && (
                              <Badge variant="secondary" className="text-xs">
                                {post.author.role}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {formatDate(post.createdAt)}
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="line-clamp-2">{post.content}</p>
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 p-0 h-auto"
                              onClick={(e) => {
                                e.stopPropagation()
                                likePost(post.id)
                              }}
                            >
                              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-primary text-primary" : ""}`} />
                              <span>{post.likes}</span>
                            </Button>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 p-0 h-auto ml-auto"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Share functionality
                                navigator.clipboard.writeText(window.location.origin + "/community/post/" + post.id)
                                toast({
                                  title: t("link_copied"),
                                  description: t("post_link_copied_to_clipboard"),
                                })
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                              <span>{t("share")}</span>
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground mb-4">
                        {searchQuery ? t("no_posts_matching_search") : t("no_discussions_yet")}
                      </p>
                      {user && <Button onClick={() => setActiveTab("new-post")}>{t("start_discussion")}</Button>}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground mb-4">{t("events_coming_soon")}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="new-post" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("create_new_post")}</CardTitle>
                    <CardDescription>{t("share_with_community")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="post-title">{t("title")}</Label>
                      <Input
                        id="post-title"
                        placeholder={t("enter_post_title")}
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-category">{t("category")}</Label>
                      <select
                        id="post-category"
                        className="w-full bg-background border rounded px-3 py-2"
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                      >
                        <option value="general">{t("general")}</option>
                        <option value="question">{t("question")}</option>
                        <option value="discussion">{t("discussion")}</option>
                        <option value="announcement">{t("announcement")}</option>
                        <option value="resource">{t("resource")}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-content">{t("content")}</Label>
                      <Textarea
                        id="post-content"
                        placeholder={t("enter_post_content")}
                        rows={6}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-tags">{t("tags")}</Label>
                      <Input
                        id="post-tags"
                        placeholder={t("enter_tags_comma_separated")}
                        value={newPostTags}
                        onChange={(e) => setNewPostTags(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("discussions")}>
                      {t("cancel")}
                    </Button>
                    <Button onClick={createPost}>{t("publish_post")}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="md:w-1/3 space-y-4">
            {activePost ? (
              <ErrorBoundary>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{activePost.title}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActivePost(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activePost.author.avatar} alt={activePost.author.name} />
                        <AvatarFallback>{activePost.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{activePost.author.name}</span>
                      {activePost.author.role && (
                        <Badge variant="secondary" className="text-xs">
                          {activePost.author.role}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatDate(activePost.createdAt)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line mb-4">{activePost.content}</p>

                    {activePost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {activePost.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto"
                        onClick={() => likePost(activePost.id)}
                      >
                        <Heart className={`h-4 w-4 ${activePost.isLiked ? "fill-primary text-primary" : ""}`} />
                        <span>{activePost.likes}</span>
                      </Button>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{activePost.comments}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 p-0 h-auto ml-auto"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + "/community/post/" + activePost.id)
                          toast({
                            title: t("link_copied"),
                            description: t("post_link_copied_to_clipboard"),
                          })
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{t("share")}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("comments")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-[400px] pr-4">
                      {comments.length > 0 ? (
                        <div className="space-y-4">
                          {comments.map((comment) => (
                            <div key={comment.id} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                                  <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{comment.author.name}</span>
                                {comment.author.role && (
                                  <Badge variant="secondary" className="text-xs">
                                    {comment.author.role}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mb-2">{comment.content}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 p-0 h-auto"
                                onClick={() => likeComment(comment.id)}
                              >
                                <Heart className={`h-4 w-4 ${comment.isLiked ? "fill-primary text-primary" : ""}`} />
                                <span>{comment.likes}</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">{t("no_comments_yet")}</p>
                        </div>
                      )}
                    </ScrollArea>

                    {user ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name || user.email} />
                          <AvatarFallback>{(user.name || user.email).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Input
                          placeholder={t("write_a_comment")}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              createComment()
                            }
                          }}
                        />
                        <Button size="icon" onClick={createComment}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-2 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">{t("login_to_comment")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ErrorBoundary>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("community_stats")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center p-2 border rounded-lg">
                        <Users className="h-5 w-5 text-primary mb-1" />
                        <span className="text-2xl font-bold">128</span>
                        <span className="text-xs text-muted-foreground">{t("members")}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-lg">
                        <MessageSquare className="h-5 w-5 text-primary mb-1" />
                        <span className="text-2xl font-bold">{posts.length}</span>
                        <span className="text-xs text-muted-foreground">{t("discussions")}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-lg">
                        <Calendar className="h-5 w-5 text-primary mb-1" />
                        <span className="text-2xl font-bold">5</span>
                        <span className="text-xs text-muted-foreground">{t("upcoming_events")}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-lg">
                        <Award className="h-5 w-5 text-primary mb-1" />
                        <span className="text-2xl font-bold">42</span>
                        <span className="text-xs text-muted-foreground">{t("achievements")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("top_contributors")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "Sarah Johnson", role: "Teacher", posts: 24, likes: 156 },
                        { name: "Ahmed Al-Farsi", role: "Developer", posts: 18, likes: 132 },
                        { name: "Maria Garcia", role: "Student", posts: 15, likes: 89 },
                        { name: "David Chen", role: "Researcher", posts: 12, likes: 76 },
                      ].map((contributor, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-shrink-0 relative">
                            <Avatar>
                              <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              {i + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contributor.name}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs mr-2">
                                {contributor.role}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{contributor.posts}</span>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{contributor.likes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("resources")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/community/guidelines">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {t("community_guidelines")}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/community/faq">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t("frequently_asked_questions")}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href="/community/events">
                          <Calendar className="h-4 w-4 mr-2" />
                          {t("upcoming_events")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
