import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useTranslation } from "@/components/shared/translations";

export default function RecentActivitiesWidget({ invoices, quotations, expenses = [], lang = 'fr' }) {
  const t = useTranslation(lang);
  const recentInvoices = invoices.slice(0, 5);
  const recentQuotations = quotations.slice(0, 5);
  const recentExpenses = expenses.slice(0, 5);

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">{t('recentActivities')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invoices">{t('invoices')}</TabsTrigger>
            <TabsTrigger value="purchases">{lang === 'fr' ? 'Achats' : 'Purchases'}</TabsTrigger>
            <TabsTrigger value="expenses">{lang === 'fr' ? 'Dépenses' : 'Expenses'}</TabsTrigger>
            <TabsTrigger value="transactions">{lang === 'fr' ? 'Transactions' : 'Transactions'}</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Net Total</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice, idx) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date || invoice.created_date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>${invoice.subtotal?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${invoice.total?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${invoice.status === 'paid' ? '0.00' : invoice.total?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge className={
                        invoice.status === 'paid' ? 'bg-green-600' :
                        invoice.status === 'sent' ? 'bg-blue-600' :
                        invoice.status === 'overdue' ? 'bg-red-600' : 'bg-slate-600'
                      }>
                        {invoice.status === 'paid' ? 'Active' : invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="purchases">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Quote No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotations.map((quote, idx) => (
                  <TableRow key={quote.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{quote.quote_number}</TableCell>
                    <TableCell>{format(new Date(quote.created_date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell>{quote.customer_name}</TableCell>
                    <TableCell>${quote.subtotal?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${quote.total?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge className={
                        quote.status === 'approved' ? 'bg-green-600' :
                        quote.status === 'sent' ? 'bg-blue-600' :
                        quote.status === 'rejected' ? 'bg-red-600' : 'bg-slate-600'
                      }>
                        {quote.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="expenses">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.map((expense, idx) => (
                  <TableRow key={expense.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{expense.description || 'Expense'}</TableCell>
                    <TableCell>{format(new Date(expense.created_date || expense.date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell>{expense.category || 'General'}</TableCell>
                    <TableCell>${expense.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-600">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="py-8 text-center text-slate-500">
              <p>{t('noDataAvailable')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}