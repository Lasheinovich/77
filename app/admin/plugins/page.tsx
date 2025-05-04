"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { redirect } from "next/navigation"
import type { Plugin } from "@/lib/plugins/plugin-manager"
import { Loader2, Plus, RefreshCw, Download, Info, Settings, Code } from "lucide-react"

export default function PluginsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, you would fetch plugins from the database
      // For now, we'll use mock data
      const mockPlugins: Plugin[] = [
        {
          id: "analytics",
          name: "Analytics",
          description: "Track user activity and generate reports",
          version: "1.0.0",
          author: "The Ark Team",
          enabled: true,
          entryPoint: "/plugins/analytics/index.js",
          dependencies: [],
          hooks: {
            "page:view": ["trackPageView"],
            "user:login": ["trackLogin"],
          },
          settings: {
            trackAnonymousUsers: true,
            sessionTimeout: 30,
          },
        },
        {
          id: "seo",
          name: "SEO Optimizer",
          description: "Automatically optimize content for search engines",
          version: "1.2.1",
          author: "The Ark Team",
          enabled: true,
          entryPoint: "/plugins/seo/index.js",
          dependencies: [],
          hooks: {
            "content:save": ["optimizeContent"],
            "page:render": ["injectMetaTags"],
          },
          settings: {
            generateSitemap: true,
            optimizeImages: true,
          },
        },
        {
          id: "social-sharing",
          name: "Social Sharing",
          description: "Add social sharing buttons to content",
          version: "0.9.5",
          author: "Community",
          enabled: false,
          entryPoint: "/plugins/social-sharing/index.js",
          dependencies: [],
          hooks: {
            "content:render": ["addSharingButtons"],
          },
          settings: {
            networks: ["twitter", "facebook", "linkedin"],
            position: "bottom",
          },
        },
      ]

      setPlugins(mockPlugins)
    } catch (error) {
      console.error("Error loading plugins:", error)
      toast({
        title: "Error loading plugins",
        description: "An error occurred while loading plugins",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      // In a real implementation, you would update the plugin in the database
      setPlugins(plugins.map((plugin) => (plugin.id === pluginId ? { ...plugin, enabled } : plugin)))

      toast({
        title: enabled ? "Plugin enabled" : "Plugin disabled",
        description: `The plugin has been ${enabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      console.error("Error toggling plugin:", error)
      toast({
        title: "Error toggling plugin",
        description: "An error occurred while toggling the plugin",
        variant: "destructive",
      })
    }
  }

  const installPlugin = async () => {
    // Mock implementation
    toast({
      title: "Install plugin",
      description: "This feature is not implemented in the demo",
    })
  }

  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Plugin Management</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadPlugins}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={installPlugin}>
            <Plus className="mr-2 h-4 w-4" />
            Install Plugin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Plugins</CardTitle>
              <CardDescription>Manage your installed plugins</CardDescription>
              <div className="mt-2">
                <Input
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPlugins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No plugins found</div>
              ) : (
                <div className="space-y-2">
                  {filteredPlugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPlugin?.id === plugin.id ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedPlugin(plugin)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{plugin.name}</div>
                        <Switch
                          checked={plugin.enabled}
                          onCheckedChange={(checked) => togglePlugin(plugin.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{plugin.description}</div>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          v{plugin.version}
                        </Badge>
                        <Badge variant={plugin.enabled ? "default" : "secondary"} className="text-xs">
                          {plugin.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedPlugin ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedPlugin.name}</CardTitle>
                  <Switch
                    checked={selectedPlugin.enabled}
                    onCheckedChange={(checked) => togglePlugin(selectedPlugin.id, checked)}
                  />
                </div>
                <CardDescription>{selectedPlugin.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="hooks">
                      <Code className="h-4 w-4 mr-2" />
                      Hooks
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium">Version</h3>
                        <p className="text-sm text-muted-foreground">{selectedPlugin.version}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Author</h3>
                        <p className="text-sm text-muted-foreground">{selectedPlugin.author}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Status</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlugin.enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Entry Point</h3>
                        <p className="text-sm text-muted-foreground">{selectedPlugin.entryPoint}</p>
                      </div>
                    </div>
                    {selectedPlugin.dependencies.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium">Dependencies</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {selectedPlugin.dependencies.map((dep) => (
                            <li key={dep}>{dep}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="settings" className="space-y-4 mt-4">
                    {Object.entries(selectedPlugin.settings).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(selectedPlugin.settings).map(([key, value]) => (
                          <div key={key}>
                            <h3 className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                            </h3>
                            {typeof value === "boolean" ? (
                              <Switch checked={value} />
                            ) : typeof value === "number" ? (
                              <Input type="number" value={value} />
                            ) : Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-2">
                                {value.map((item) => (
                                  <Badge key={item} variant="outline">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Input value={String(value)} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No settings available</div>
                    )}
                  </TabsContent>
                  <TabsContent value="hooks" className="space-y-4 mt-4">
                    {Object.entries(selectedPlugin.hooks).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(selectedPlugin.hooks).map(([hook, callbacks]) => (
                          <div key={hook}>
                            <h3 className="text-sm font-medium">{hook}</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                              {callbacks.map((callback) => (
                                <li key={callback}>{callback}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No hooks available</div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="destructive">Uninstall</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold">No Plugin Selected</h2>
                <p className="text-muted-foreground mt-2">Select a plugin from the list to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
