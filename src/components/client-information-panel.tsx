"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateClient } from "@/actions/case";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  label: string;
}

interface ClientInformationPanelProps {
  client: Client;
  extractedFields?: ExtractedField[];
  caseMetadata?: any;
}

export function ClientInformationPanel({ 
  client, 
  extractedFields,
  caseMetadata 
}: ClientInformationPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState({
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = async () => {
    if (!editedClient.name.trim()) return;
    
    startTransition(async () => {
      try {
        const result = await updateClient({
          clientId: client.id,
          name: editedClient.name.trim(),
          email: editedClient.email.trim() || undefined,
          phone: editedClient.phone.trim() || undefined,
          address: editedClient.address.trim() || undefined,
        });

        if (result.success) {
          setIsEditing(false);
          router.refresh(); // Refresh to show updated client info
        } else {
          console.error("Failed to update client:", result.error);
        }
      } catch (error) {
        console.error("Failed to update client:", error);
      }
    });
  };

  const handleCancel = () => {
    setEditedClient({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    });
    setIsEditing(false);
  };

  const aiExtractedFields = caseMetadata?.aiExtraction?.extractedFields as ExtractedField[] | undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Contact details and extracted information
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className="flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {/* Client Details */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editedClient.name}
                    onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{client.name || "N/A"}</span>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedClient.email}
                  onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                />
              </div>
            ) : (
              client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{client.email}</span>
                </div>
              )
            )}

            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editedClient.phone}
                  onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                />
              </div>
            ) : (
              client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{client.phone}</span>
                </div>
              )
            )}

            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editedClient.address}
                  onChange={(e) => setEditedClient({ ...editedClient, address: e.target.value })}
                />
              </div>
            ) : (
              client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-sm">{client.address}</span>
                </div>
              )
            )}

            {isEditing && (
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
          
          {/* Extracted Fields */}
          {aiExtractedFields && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Extracted Information</h4>
              <div className="space-y-2">
                {aiExtractedFields.map((field: ExtractedField, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{field.label}:</span>
                    <span className="text-sm">{field.fieldValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}