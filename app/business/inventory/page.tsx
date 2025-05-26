"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Search, Plus, Edit, Trash2, AlertTriangle, Package, ShoppingCart } from "lucide-react"
import { supabase } from "@/lib/supabase"

type InventoryItem = {
  id: string
  name: string
  category: "product" | "supply" | "equipment"
  brand: string
  quantity: number
  minQuantity: number
  price: number
  lastRestocked: string
}

type OrderItem = {
  itemId: string
  quantity: number
}

type Order = {
  id: string
  date: string
  supplier: string
  items: {
    name: string
    quantity: number
    price: number
  }[]
  total: number
  status: "processing" | "shipped" | "delivered" | "cancelled"
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [newItem, setNewItem] = useState<Omit<InventoryItem, "id" | "lastRestocked">>({
    name: "",
    category: "product",
    brand: "",
    quantity: 0,
    minQuantity: 0,
    price: 0,
  })
  const [newOrder, setNewOrder] = useState({
    supplier: "",
    items: [] as OrderItem[],
  })

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setInventory(data || [])
      } catch (error) {
        console.error('Error fetching inventory:', error)
        setError('Failed to load inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [])

  // Filter inventory items
  const filteredItems = inventory.filter(
    (item) =>
      (categoryFilter === "all" || item.category === categoryFilter) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Low stock items
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minQuantity)

  const handleAddItem = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          ...newItem,
          lastRestocked: new Date().toISOString().split("T")[0],
        }])
        .select()
        .single()

      if (error) throw error

      setInventory([...inventory, data])
      setNewItem({
        name: "",
        category: "product",
        brand: "",
        quantity: 0,
        minQuantity: 0,
        price: 0,
      })
      setShowAddItemDialog(false)
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to your inventory.`,
      })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: "Error",
        description: "Failed to add item to inventory",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInventory(inventory.filter((item) => item.id !== id))
      toast({
        title: "Item deleted",
        description: "The item has been removed from your inventory.",
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleCreateOrder = async () => {
    if (!newOrder.supplier || newOrder.items.length === 0) return

    try {
      const orderItems = newOrder.items.map((orderItem) => {
        const item = inventory.find((i) => i.id === orderItem.itemId)
        return {
          name: item?.name || "",
          quantity: orderItem.quantity,
          price: item?.price || 0,
        }
      })

      const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          supplier: newOrder.supplier,
          items: orderItems,
          total,
          status: "processing",
        }])
        .select()
        .single()

      if (error) throw error

      setOrderHistory([data, ...orderHistory])
      setNewOrder({
        supplier: "",
        items: [],
      })
      setShowOrderDialog(false)
      toast({
        title: "Order created",
        description: `Your order with ${newOrder.supplier} has been created.`,
      })
    } catch (error) {
      console.error('Error creating order:', error)
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      })
    }
  }

  const handleAddToOrder = (itemId: string, quantity: number) => {
    const existingItemIndex = newOrder.items.findIndex((item) => item.itemId === itemId)
    if (existingItemIndex !== -1) {
      const updatedItems = [...newOrder.items]
      updatedItems[existingItemIndex].quantity += quantity
      setNewOrder({ ...newOrder, items: updatedItems })
    } else {
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { itemId, quantity }],
      })
    }
    toast({
      title: "Item added to order",
      description: `${quantity} units added to your order.`,
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!user || user.role !== "business") {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be logged in as a business owner to access this page.</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage your shop's inventory</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Place an order for inventory items from your suppliers.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="Supplier name"
                    value={newOrder.supplier}
                    onChange={(e) => setNewOrder({ ...newOrder, supplier: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Order Items</Label>
                  {newOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items added yet. Add items from your inventory.</p>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newOrder.items.map((orderItem) => {
                            const item = inventory.find((i) => i.id === orderItem.itemId)
                            if (!item) return null
                            return (
                              <TableRow key={orderItem.itemId}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{orderItem.quantity}</TableCell>
                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                <TableCell>${(item.price * orderItem.quantity).toFixed(2)}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrder}>Create Order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>Add a new item to your inventory.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value as InventoryItem["category"] })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="supply">Supply</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="Enter brand name"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Minimum Quantity</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min="0"
                      value={newItem.minQuantity}
                      onChange={(e) => setNewItem({ ...newItem, minQuantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="supply">Supplies</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage your inventory items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>{new Date(item.lastRestocked).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View your past orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderHistory.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell>{order.supplier}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell>${order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need to be restocked</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Quantity</TableHead>
                        <TableHead>Minimum Quantity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToOrder(item.id, item.minQuantity - item.quantity)}
                            >
                              Order More
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Stocked Up</h3>
                  <p className="text-muted-foreground">No items are currently low in stock.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
