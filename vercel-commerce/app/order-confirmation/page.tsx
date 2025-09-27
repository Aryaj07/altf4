"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, Package, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/order-details/order-confirmation/${orderId}`)
        .then((res) => res.json())
        .then((data) => setOrder(data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  // Helper for formatting money (Medusa amounts are in smallest currency unit)
  const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format((amount || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-lg text-red-500">Could not load order details.</span>
      </div>
    );
  }

  // Map Medusa order fields to UI fields
  const shipping = order.shipping_address || {};
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const shippingTotal = order.shipping_total || 0;
  const taxTotal = order.tax_total || 0;
  const total = order.total || 0;
  const currency = order.currency_code || "USD";
  const customerEmail = order.email || "";
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  // You may want to calculate or fetch estimated delivery
  const estimatedDelivery = ""; // Set if available

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8 animate-in fade-in-0 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-900/30 rounded-full mb-4 animate-in zoom-in-0 duration-500 delay-200">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-neutral-300 mb-4">
            Thank you for your purchase. We are preparing your order.
          </p>
          <Badge className="text-sm font-mono px-4 py-2 bg-neutral-800 text-neutral-200">
            Order ID: {order.id}
          </Badge>
        </div>

        <div className="grid gap-6 md:gap-8">
          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            {/* Customer Information */}
            <Card className="bg-neutral-800 text-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-400">Email</p>
                  <p className="font-medium text-white">{customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Order Date</p>
                  <p className="font-medium text-white">{orderDate}</p>
                </div>
                {estimatedDelivery && (
                  <div>
                    <p className="text-sm text-neutral-400">Estimated Delivery</p>
                    <p className="font-medium text-green-400">
                      {estimatedDelivery}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="bg-neutral-800 text-white hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Truck className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic space-y-1 text-white">
                  <p className="font-medium">
                    {shipping.first_name} {shipping.last_name}
                  </p>
                  <p>{shipping.address_1}</p>
                  <p>
                    {shipping.city}
                    {shipping.state ? `, ${shipping.state}` : ""}{" "}
                    {shipping.postal_code}
                  </p>
                  <p>{shipping.country_code?.toUpperCase()}</p>
                </address>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="bg-neutral-800 text-white animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShoppingBag className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-700">
                      <TableHead className="text-neutral-200 w-[100px]">Product</TableHead>
                      <TableHead className="text-neutral-200">Details</TableHead>
                      <TableHead className="text-neutral-200 text-center">Qty</TableHead>
                      <TableHead className="text-neutral-200 text-right">Price</TableHead>
                      <TableHead className="text-neutral-200 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => (
                      <TableRow
                        key={item.id}
                        className="border-neutral-700 hover:bg-neutral-800/50 transition-colors"
                      >
                        <TableCell>
                          <Image
                            src={
                              item.thumbnail ||
                              item.variant?.product?.thumbnail ||
                              "/placeholder.svg"
                            }
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">
                              {item.title}
                            </p>
                            <p className="text-sm text-neutral-400">
                              {item.variant?.title || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-white">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatMoney(item.unit_price, currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatMoney((item.unit_price * item.quantity) + shippingTotal, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-6 bg-neutral-700" />

              {/* Order Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Shipping</span>
                  <span>{formatMoney(shippingTotal, currency)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Tax</span>
                  <span>{formatMoney(taxTotal, currency)}</span>
                </div>
                <Separator className="bg-neutral-700" />
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span>{formatMoney(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-4 duration-700 delay-700">
            <Button
              className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 hover:scale-105 px-6 py-3 text-base font-medium rounded"
              asChild
            >
              <a href="/">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </a>
            </Button>
            <Button
              className="bg-transparent hover:bg-neutral-800 transition-all duration-300 hover:scale-105 px-6 py-3 text-base font-medium rounded border border-neutral-700 text-white"
              asChild
            >
              <a href="#">
                <Package className="w-4 h-4 mr-2" />
                Track Order
              </a>
            </Button>
          </div>

          {/* Additional Information */}
          <Card className="bg-blue-900/20 border-blue-800 animate-in slide-in-from-bottom-4 duration-700 delay-900">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-blue-100">
                  What happens next?
                </h3>
                <p className="text-sm text-blue-200">
                  You’ll receive an email confirmation shortly. We’ll send you tracking information once your order ships.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}