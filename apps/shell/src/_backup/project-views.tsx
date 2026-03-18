class Abc {
  // ============================================================================
  // ============================================================================
  // ============================================================================
  // ============================================================================

  // MARK: OLD
  // ============================================================================

  LoadingView() {
    if (this.state.initialized) return null
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  NoDirectoryView() {
    if (!this.state.initialized) return null
    if (this.state.handle) return null

    return (
      <div className="flex size-full flex-col items-center justify-center gap-6 p-8">
        <this.HeaderView />

        <div className="text-center">
          <h2 className="text-xl font-semibold">No Directory Connected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Connect a directory to load your project files</p>
        </div>

        {this.state.error && (
          <Alert variant="destructive" className="w-full max-w-md">
            <AlertCircle className="size-4" />
            <AlertDescription>{this.state.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-md space-y-3">
          <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">How it works:</p>
            <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
              <li>Click "Connect Directory" below</li>
              <li>Select the folder where your project files are located</li>
              <li>The kit will automatically load epos.json, assets, and sources</li>
            </ol>
          </div>

          <Button onClick={() => this.connectDir()} className="w-full" size="sm">
            <IconFolderOpen className="mr-2 size-4" />
            Connect Directory
          </Button>
        </div>
      </div>
    )
  }

  MainView() {
    if (!this.state.initialized) return null
    // return (
    //   <div className="flex h-full flex-col p-6">
    //     <this.HeaderView />
    //     <this.ContentView />
    //   </div>
    // )

    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              {this.state.error && (
                <div className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  <IconAlertCircle className="size-3" />
                  Error
                </div>
              )}
              {this.state.refreshing && (
                <div className="flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-500">
                  <Spinner className="size-3" />
                  refreshing
                </div>
              )}
            </div>
            {/* Directory and Reconnect */}
            <div className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="font-medium">Directory:</span>
              <span className="text-muted-foreground">./{this.state.handle?.name || 'unknown'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => this.connectDir()}
                className="ml-2 px-2 py-0.5 text-xs"
                title="Reconnect to a different directory"
              >
                <IconRefresh className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        {this.state.error && (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            {/* <AlertDescription>
              <p className="font-medium">{this.state.error.message}</p>
              {this.state.error.cause ? (
                <p className="mt-1 text-xs opacity-90">
                  {
                    (this.state.error.cause instanceof Error
                      ? this.state.error.cause.message
                      : String(this.state.error.cause)) as any
                  }
                </p>
              ) : null}
            </AlertDescription> */}
          </Alert>
        )}

        <div>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {(['spec', 'sources', 'assets', 'manifest'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => (this.state.activeTab = tab)}
                className={cn(
                  'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  this.state.activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab === 'spec' && 'epos.json'}
                {tab === 'sources' && 'Sources'}
                {tab === 'assets' && 'Assets'}
                {tab === 'manifest' && 'Manifest'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {this.state.activeTab === 'spec' && <this.SpecTabView />}
            {this.state.activeTab === 'manifest' && <this.ManifestTabView />}
            {this.state.activeTab === 'assets' && <this.AssetsTabView />}
            {this.state.activeTab === 'sources' && <this.SourcesTabView />}
          </div>

          {/* Footer with controls */}
          <div className="flex flex-col gap-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Toggles */}
                <Label className="flex items-center gap-3">
                  <div className="text-sm font-medium">Enabled</div>
                  <Switch checked={this.enabled} onCheckedChange={() => this.toggleEnabled()} />
                </Label>

                <Separator orientation="vertical" className="h-6" />

                <Label className="flex items-center gap-3">
                  <div className="text-sm font-medium">Debug</div>
                  <Switch checked={this.debug} onCheckedChange={() => this.toggleDebug()} />
                </Label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => (this.state.showExportDialog = true)}>
                  <IconDownload className="mr-1 size-4" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => this.remove()}
                  className="text-destructive hover:text-destructive"
                >
                  <IconTrash className="mr-1 size-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Export Dialog */}
          <Sheet open={this.state.showExportDialog} onOpenChange={opened => (this.state.showExportDialog = opened)}>
            <SheetContent side="right" className="flex w-full flex-col overflow-hidden sm:max-w-2xl">
              <SheetHeader>
                <SheetTitle>Export Project</SheetTitle>
                <SheetDescription>
                  Review the contents before exporting {this.spec.slug}-{this.spec.version}.zip
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-auto">
                {/* Unminified sources warning */}
                {this.hasUnminifiedSources() && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/5">
                    <IconAlertCircle className="size-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      <p className="font-medium">Sources are not minified</p>
                      <p className="mt-1 text-xs">Consider minifying your sources before exporting for production use.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manifest */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Manifest</h3>
                  <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                    {JSON.stringify(this.manifest, null, 2)}
                  </pre>
                </div>

                <Separator />

                {/* Assets */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Assets ({this.spec.assets.length})</h3>
                  <div className="space-y-1 text-xs">
                    {this.spec.assets.length === 0 ? (
                      <p className="text-muted-foreground">No assets</p>
                    ) : (
                      <>
                        {this.spec.assets.map(path => (
                          <div key={path} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                            <code className="text-muted-foreground">{path}</code>
                            <span className="font-medium">
                              {this.assetsMeta[path] ? `${(this.assetsMeta[path].size / 1024).toFixed(2)} KB` : '—'}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between border-t px-2 py-2 text-xs font-medium">
                          <span>Total Assets</span>
                          <span>
                            {(Object.values(this.assetsMeta).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)}{' '}
                            KB
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sources */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Sources ({Object.keys(this.sourcesMeta).length})</h3>
                  <div className="space-y-1 text-xs">
                    {Object.keys(this.sourcesMeta).length === 0 ? (
                      <p className="text-muted-foreground">No sources</p>
                    ) : (
                      <>
                        {Object.keys(this.sourcesMeta).map(path => (
                          <div key={path} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                            <code className="text-muted-foreground">{path}</code>
                            <span className="font-medium">
                              {this.sourcesMeta[path] ? `${(this.sourcesMeta[path].size / 1024).toFixed(2)} KB` : '—'}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between border-t px-2 py-2 text-xs font-medium">
                          <span>Total Sources</span>
                          <span>
                            {(Object.values(this.sourcesMeta).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)}{' '}
                            KB
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => (this.state.showExportDialog = false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    this.export()
                    this.state.showExportDialog = false
                  }}
                  className="flex-1"
                >
                  <IconDownload className="mr-1 size-4" />
                  Export Now
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    )
  }

  private HeaderView() {
    return (
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl">{this.spec.name}</h1>
          <div className="mt-1.5 flex gap-2">
            <Badge variant="secondary" className="select-none">
              {this.spec.slug}
            </Badge>
            <Badge variant="secondary" className="select-none">
              v{this.spec.version}
            </Badge>
          </div>
        </div>
        <div className="">
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.remove()}
            className="text-destructive hover:text-destructive"
          >
            <IconTrash className="mr-1 size-4" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  ConnectView() {
    return (
      <div className="flex grow items-center justify-center">
        <Card className="w-90">
          <CardHeader>
            <CardTitle>Connect Your Project</CardTitle>
            <CardDescription>
              To get started, please select the folder where your project files are located.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={this.connectDir}>
              <IconFolderOpen /> Choose Folder
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  ContentView() {
    return (
      <div className="relative mt-6 grow border border-dashed border-border p-6">
        <div className="absolute top-0 left-0 flex">
          <div className="flex items-center gap-2 border-r border-b border-dashed border-border p-2 text-xs">
            {this.spec.slug}
          </div>
          <div className="flex items-center gap-2 border-r border-b border-dashed border-border p-2 text-xs">
            v{this.spec.version}
          </div>
          <div className="flex items-center gap-2 border-r border-b border-dashed border-border p-2 text-xs">
            <IconDownload className="size-3" />
            Export
          </div>
        </div>
        <div className="absolute top-0 right-0 flex">
          <div className="flex items-center gap-2 border-b border-l border-dashed border-border p-2 text-xs text-destructive">
            <IconTrash className="size-3" />
            Remove
          </div>
        </div>
      </div>
    )

    if (!this.state.handle) return <this.ConnectView />
    if (this.state.error) return <this.ErrorView />
    return <div>CONNECTED AS {this.state.handle?.name}</div>
  }

  ErrorView() {
    return (
      <div className="mt-6">
        <Alert variant="destructive" className="w-full">
          <IconAlertCircle className="size-4" />
          <AlertDescription>Error: {this.state.error?.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  SpecTabView() {
    return (
      <div className="h-full overflow-hidden">
        {this.specText ? (
          <pre className="h-full overflow-auto rounded border bg-muted p-4 font-mono text-xs">{this.specText}</pre>
        ) : (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No epos.json loaded</div>
        )}
      </div>
    )
  }

  ManifestTabView() {
    return (
      <div className="h-full overflow-hidden">
        <pre className="h-full overflow-auto rounded border bg-muted p-4 font-mono text-xs">
          {JSON.stringify(this.manifest, null, 2)}
        </pre>
      </div>
    )
  }

  AssetsTabView() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {this.spec.assets.length === 0 ? (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No assets in this project</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Path</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {this.spec.assets.map(path => (
                  <tr key={path} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{path}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {this.assetsMeta[path] ? `${(this.assetsMeta[path].size / 1024).toFixed(2)} KB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2 text-xs font-medium">Total Assets</td>
                  <td className="px-4 py-2 text-right text-xs font-medium">
                    {(Object.values(this.assetsMeta).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  SourcesTabView() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {Object.keys(this.sourcesMeta).length === 0 ? (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No sources in this project</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Path</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(this.sourcesMeta).map(path => (
                  <tr key={path} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{path}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {this.sourcesMeta[path] ? `${(this.sourcesMeta[path].size / 1024).toFixed(2)} KB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2 text-xs font-medium">Total Sources</td>
                  <td className="px-4 py-2 text-right text-xs font-medium">
                    {(Object.values(this.sourcesMeta).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }
}
