import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PageContainer } from "@/components/shared/PageContainer"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable } from "@/components/shared/DataTable"

export const Route = createFileRoute("/dev/ui")({ component: UIPlayground })

function UIPlayground() {
  const { t } = useTranslation()
  if (!import.meta.env.DEV) return <div className="p-8 text-sm text-muted-foreground">Playground is dev-only.</div>
  return (
    <PageContainer>
      <PageHeader titleKey="dev.ui.title" descriptionKey="dev.ui.description" />
      <Tabs defaultValue="buttons" className="mt-6">
        <TabsList>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
        </TabsList>
        <TabsContent value="buttons" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buttons</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
              <Button>
                <span className="animate-pulse">●</span> Loading
              </Button>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <StatusBadge status="success" label="Success" />
            <StatusBadge status="warning" label="Warning" />
            <StatusBadge status="error" label="Error" />
          </div>
        </TabsContent>
        <TabsContent value="inputs" className="space-y-4 pt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Input</Label>
                <Input placeholder={t("common.searchPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>Select</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">Option A</SelectItem>
                    <SelectItem value="b">Option B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox /> Checkbox
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch /> Switch
                </label>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">Dialog content with semantic tokens.</p>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tables" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DataTable</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { header: "ID", accessorKey: "id", align: "right" },
                  { header: "Name", accessorKey: "name" },
                  { header: "Status", cell: () => <StatusBadge status="success" label="active" /> },
                ]}
                data={[
                  { id: 1, name: "example" },
                  { id: 2, name: "demo" },
                ] as unknown as Record<string, unknown>[]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raw Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>Alpha</TableCell>
                    <TableCell className="text-right">42</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="states" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <EmptyState titleKey="keys.emptyTitle" descriptionKey="keys.emptyDesc" action={<Button>{t("keys.createKey")}</Button>} />
            <ErrorState message="Failed to load" onRetry={() => alert("retry")} />
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-8 space-y-2">
        <h3 className="text-sm font-semibold">Tokens</h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="h-12 rounded bg-background border flex items-center justify-center">background</div>
          <div className="h-12 rounded bg-primary text-primary-foreground flex items-center justify-center">primary</div>
          <div className="h-12 rounded bg-muted flex items-center justify-center">muted</div>
          <div className="h-12 rounded bg-destructive text-destructive-foreground flex items-center justify-center">destructive</div>
        </div>
        <p className="text-xs text-muted-foreground">Spacing: gap-2/4/6, Radius: 0 (sharp), Font: Oxanium Variable. Check at 390px and 1440px.</p>
      </div>
    </PageContainer>
  )
}
