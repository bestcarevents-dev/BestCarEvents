 {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your listings...</div>
      ) : (
        listingTables.map((table) => (
          <Card key={table.label} className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{table.label}</CardTitle>
                  <CardDescription>Manage your {table.label.toLowerCase()} here.</CardDescription>
                </div>
                {table.label === "Cars Listing" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/advertise/cars')}
                    >
                      Buy Car Listing
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/cars/add')}
                    >
                      List your car
                    </Button>
                  </div>
                )}
                {table.label === "Events Listing" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/advertise/dashboard')}
                    >
                      Buy Featured
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/events/host')}
                    >
                      List your event
                    </Button>
                  </div>
                )}
                {table.label === "Auction Listing" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/advertise/dashboard')}
                    >
                      Buy Featured
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/auctions/submit')}
                    >
                      List your auction
                    </Button>
                  </div>
                )}
                {table.label === "Hotel Listing" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/advertise/dashboard')}
                    >
                      Buy Featured
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/hotels/list')}
                    >
                      List your hotel
                    </Button>
                  </div>
                )}
                {table.label === "Club Listing" && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => router.push('/advertise/dashboard')}
                    >
                      Buy Featured
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/clubs/register')}
                    >
                      List your club
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Add current car listings cards for Cars Listing section */}
              {table.label === "Cars Listing" && userDoc && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Current Car Listing Credit</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CAR_LISTING_TIERS.map((tier) => (
                      <div key={tier.name} className="text-center p-3 bg-muted rounded">
                        <p className="text-sm font-medium">{tier.name}</p>
                        <p className="text-lg font-bold text-primary">
                          {userDoc[`cars_${tier.key}`] || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Credit cards for Events Listing section */}
              {table.label === "Events Listing" && userDoc && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Current Event Listing Credit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Standard Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.standardListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Featured Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.featuredListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Credit cards for Auction Listing section */}
              {table.label === "Auction Listing" && userDoc && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Current Auction Listing Credit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Standard Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.standardListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Featured Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.featuredListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Credit cards for Hotel Listing section */}
              {table.label === "Hotel Listing" && userDoc && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Current Hotel Listing Credit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Standard Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.standardListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Featured Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.featuredListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Credit cards for Club Listing section */}
              {table.label === "Club Listing" && userDoc && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Current Club Listing Credit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Standard Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.standardListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-medium">Featured Listing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {userDoc.featuredListingRemaining || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                    <TableRow>
                    {table.columns.map((col) => (
                      <TableHead key={typeof col.key === "string" ? col.key : col.label}>{col.label}</TableHead>
                    ))}
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {table.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={table.columns.length + 1} className="text-center text-muted-foreground">No listings found.</TableCell>
                    </TableRow>
                  ) : (
                    table.data.map((item: any) => (
                      <TableRow key={item.id}>
                        {table.columns.map((col, idx) => (
                          <TableCell key={idx}>
                            {typeof col.key === "function"
                              ? col.key(item)
                              : col.key === "deactivated"
                              ? item.deactivated ? "Yes" : "No"
                              : col.key === "featured"
                              ? item.featured ? "Yes" : "No"
                              : col.key === "type"
                              ? item.type || "N/A"
                              : col.key === "eventDate" || col.key === "startDate"
                              ? item[col.key]?.seconds
                                ? new Date(item[col.key].seconds * 1000).toLocaleDateString('en-GB')
                                : item[col.key]?.toString() || "-"
                              : item[col.key] || "-"}
                          </TableCell>
                        ))}
                        <TableCell className="flex gap-2">
                          {table.label !== "Cars Listing" && (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem asChild>
                                    <Link href={table.viewPath + item.id}>View</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeactivate(table.col, item.id)}
                                    disabled={item.deactivated}
                                  >
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Dialog open={advertiseModal?.open && advertiseModal.col === table.col && advertiseModal.id === item.id} onOpenChange={(open) => {
                                if (!open) {
                                  setAdvertiseModal(null);
                                  setSelectedFeatureType(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant={item.featured ? "secondary" : "default"}
                                    size="sm"
                                    disabled={item.featured}
                                    onClick={() => {
                                      setAdvertiseModal({ open: true, col: table.col, id: item.id });
                                      setSelectedFeatureType(null);
                                    }}
                                  >
                                    {item.featured ? "Featured" : "Feature"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Feature Listing</DialogTitle>
                                    <DialogDescription>
                                      Choose a feature type for your listing.
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {/* Credit Cards */}
                                  {userDoc && (
                                    <div className="mb-4">
                                      <h4 className="text-sm font-medium mb-2">Your Current Credit</h4>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-muted rounded text-center">
                                          <p className="text-sm font-medium">Standard</p>
                                          <p className="text-lg font-bold text-primary">
                                            {userDoc.standardListingRemaining || 0}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Remaining</p>
                                        </div>
                                        <div className="p-3 bg-muted rounded text-center">
                                          <p className="text-sm font-medium">Featured</p>
                                          <p className="text-lg font-bold text-primary">
                                            {userDoc.featuredListingRemaining || 0}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Remaining</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Feature Type Selection */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="radio" 
                                        id="feature-standard" 
                                        name="feature-type" 
                                        value="standard" 
                                        checked={selectedFeatureType === 'standard'} 
                                        onChange={() => setSelectedFeatureType('standard')}
                                        disabled={!userDoc || userDoc.standardListingRemaining <= 0}
                                      />
                                      <Label htmlFor="feature-standard" className="flex-1">
                                        <div className="font-medium">Standard Listing</div>
                                        <div className="text-sm text-muted-foreground">
                                          Will display in the featured section for 1 month only
                                        </div>
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="radio" 
                                        id="feature-featured" 
                                        name="feature-type" 
                                        value="featured" 
                                        checked={selectedFeatureType === 'featured'} 
                                        onChange={() => setSelectedFeatureType('featured')}
                                        disabled={!userDoc || userDoc.featuredListingRemaining <= 0}
                                      />
                                      <Label htmlFor="feature-featured" className="flex-1">
                                        <div className="font-medium">Featured (Premium) Listing</div>
                                        <div className="text-sm text-muted-foreground">
                                          Will stay in the featured section for 1 year and will have higher priority and more clicks
                                        </div>
                                      </Label>
                                    </div>
                                  </div>
                                  
                                  <div className="py-4 text-center">
                                    <Button
                                      className="w-full text-lg py-4"
                                      disabled={advertiseLoading || !selectedFeatureType}
                                      onClick={() => handleAdvertise(table.col, item.id)}
                                    >
                                      {advertiseLoading ? "Processing..." : `Feature ${selectedFeatureType === 'standard' ? 'Standard' : 'Premium'}`}
                                    </Button>
                                  </div>
                                  
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          {table.label === "Cars Listing" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">Actions</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                  <Link href={table.viewPath + item.id}>View</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeactivate(table.col, item.id)}
                                  disabled={item.deactivated}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
        ))
      )}