import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, DollarSign, Package } from "lucide-react";

export default function PriceListCard({ priceList, isBundle, onEdit, onDelete }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {isBundle ? <Package className="w-5 h-5 text-blue-600" /> : <DollarSign className="w-5 h-5 text-green-600" />}
          <CardTitle className="text-lg">{priceList.name}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm(`Delete this ${isBundle ? 'bundle' : 'price list'}?`)) onDelete();
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {priceList.description && (
          <p className="text-sm text-slate-600 mb-3">{priceList.description}</p>
        )}
        
        {isBundle ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Bundle Price:</span>
              <span className="text-lg font-bold text-green-600">
                ${priceList.bundle_price?.toFixed(2)}
              </span>
            </div>
            {priceList.original_price > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Original Price:</span>
                  <span className="line-through text-slate-400">
                    ${priceList.original_price?.toFixed(2)}
                  </span>
                </div>
                {priceList.discount_percentage > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    Save {priceList.discount_percentage}%
                  </Badge>
                )}
              </>
            )}
            <p className="text-sm text-slate-500 mt-2">
              {priceList.items?.length || 0} items in bundle
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              {priceList.items?.length || 0} services
            </p>
            {priceList.is_default && (
              <Badge className="mt-2 bg-blue-100 text-blue-700">Default</Badge>
            )}
            {priceList.status === 'inactive' && (
              <Badge className="mt-2 bg-gray-100 text-gray-700">Inactive</Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}