"use client"

import { useState } from "react"
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

// Mock inventory data
const mockInventoryItems = [
  {
    id: "1",
    name: "Professional Hair Clipper",
    category: "equipment",
    brand: "Wahl",
    quantity: 5,
    minQuantity: 2,
    price: 89.99,
    lastRestocked: "2023-11-10",
  },
  {
    id: "2",
    name: "Styling Pomade",
    category: "product",
    brand: "American Crew",
    quantity: 12,
    minQuantity: 5,
    price: 18.99,
    lastRestocked: "2023-11-15",
  },
  {
    id: "3",
    name: "Beard Oil",
    category: "product",
    brand: "Beardbrand",
    quantity: 8,
    minQuantity: 3,
    price: 24.99,
    lastRestocked: "2023-11-05",
  },
  {
    id: "4",
    name: "Barber Chair",
    category: "furniture",
    brand: "Salon Pro",
    quantity: 3,
    minQuantity: 1,
    price: 599.99,
    lastRestocked: "2023-10-20",
  },
  {
    id: "5",
    name: "Hair Dryer",
    category: "equipment",
    brand: "Dyson",
    quantity: 2,
    minQuantity: 1,
    price: 399.99,
    lastRestocked: "2023-10-15",
  },
  {
    id: "6",
    name: "Shampoo",
    category: "product",
    brand: "Redken",
    quantity: 15,
    minQuantity: 5,
    price: 22.99,
    lastRestocked: "2023-11-12",
  },
  {
    id: "7",
    name: "Straight Razor",
    category: "equipment",
    brand: "Parker",
    quantity: 4,
    minQuantity: 2,
    price: 34.99,
    lastRestocked: "2023-11-01",
  },
  {
    id: "8",
    name: "Barber Cape",
    category: "supplies",
    brand: "Salon Pro",
    quantity: 10,
    minQuantity: 4,
    price: 19.99,
    lastRestocked: "2023-11-08",
  },
]

// Mock order history
const mockOrderHistory = [
  {
    id: "order1",
    date: "2023-11-15",
    supplier: "Barber Supply Co.",
    items: [
      { name: "Styling Pomade", quantity: 10, price: 15.99 },
      { name: "Beard Oil", quantity: 5, price: 21.99 },
    ],
    total: 269.85,
    status: "delivered",
  },
  {
    id: "order2",
    date: "2023-11-05",
    supplier: "Pro Equipment",
    items: [
      { name: "Professional Hair Clipper", quantity: 2, price: 79.99 },
      { name: "Hair Dryer", quantity: 1, price: 349.99 },
    ],
    total: 509.97,
    status: "delivered",
  },
  {
    id: "order3",
    date: "2023-11-20",
    supplier: "Barber Supply Co.",
    items: [
      { name: "Shampoo", quantity: 8, price: 19.99 },
      { name: "Barber Cape", quantity: 5, price: 17.99 },
    ],
    total: 249.87,
    status: "processing",
  },
]

export default function InventoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems)
  const [orderHistory, setOrderHistory] = useState(mockOrderHistory)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "product",
    brand: "",
    quantity: 0,
    minQuantity: 0,
    price: 0,
  })
  const [newOrder, setNewOrder] = useState({
    supplier: "",
    items: [] as { itemId: string; quantity: number }[],
  })

  // Filter inventory items
  const filteredItems = inventoryItems.filter(
    (item) =>
      (categoryFilter === "all" || item.category === categoryFilter) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Low stock items
  const lowStockItems = inventoryItems.filter((item) => item.quantity <= item.minQuantity)

  const handleAddItem = () => {
    const id = `item_${Date.now()}`
    setInventoryItems([
      ...inventoryItems,
      {
        id,
        ...newItem,
        lastRestocked: new Date().toISOString().split("T")[0],
      },
    ])
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
  }

  const handleDeleteItem = (id: string) => {
    setInventoryItems(inventoryItems.filter((item) => item.id !== id))
    toast({
      title: "Item deleted",
      description: "The item has been removed from your inventory.",
    })
  }

  const handleCreateOrder = () => {
    if (!newOrder.supplier || newOrder.items.length === 0) return

    const orderItems = newOrder.items.map((orderItem) => {
      const item = inventoryItems.find((i) => i.id === orderItem.itemId)
      return {
        name: item?.name || "",
        quantity: orderItem.quantity,
        price: item?.price || 0,
      }
    })

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const newOrderObj = {
      id: `order_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      supplier: newOrder.supplier,
      items: orderItems,
      total,
      status: "processing" as const,
    }

    setOrderHistory([newOrderObj, ...orderHistory])
    setNewOrder({
      supplier: "",
      items: [],
    })
    setShowOrderDialog(false)
    toast({
      title: "Order created",
      description: `Your order with ${newOrder.supplier} has been created.`,
    })
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
                            const item = inventoryItems.find((i) => i.id === orderItem.itemId)
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

                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="text-xl font-bold">
                    $
                    {newOrder.items
                      .reduce((sum, orderItem) => {
                        const item = inventoryItems.find((i) => i.id === orderItem.itemId)
                        return sum + (item?.price || 0) * orderItem.quantity
                      }, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrder} disabled={!newOrder.supplier || newOrder.items.length === 0}>
                  Create Order
                </Button>
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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Add a new item to your inventory. Fill out the details below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Professional Hair Clipper"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="e.g. Wahl"
                      value={newItem.brand}
                      onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Min Quantity</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min="0"
                      value={newItem.minQuantity}
                      onChange={(e) => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.brand || newItem.price <= 0}>
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or brand"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No items found. Try adjusting your search or add a new item.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={item.quantity <= item.minQuantity ? "text-red-500 font-medium" : ""}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minQuantity && <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />}
                        </div>
                      </TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.lastRestocked}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleAddToOrder(item.id, 1)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that are at or below their minimum quantity threshold</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">All stocked up!</h3>
                  <p className="text-muted-foreground text-center">You don't have any items that are low on stock.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Quantity</TableHead>
                        <TableHead>Min Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-red-500 font-medium">{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity}</TableCell>
                          <TableCell>${item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToOrder(item.id, item.minQuantity * 2 - item.quantity)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="space-y-6">
            {orderHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    You haven't placed any orders yet. Create your first order to restock your inventory.
                  </p>
                  <Button onClick={() => setShowOrderDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orderHistory.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <CardDescription>
                          {order.date} - {order.supplier}
                        </CardDescription>
                      </div>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-bold">${order.total.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
