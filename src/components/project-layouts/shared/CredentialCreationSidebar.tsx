
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLayout } from "@/context/layout";
import { X, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const CredentialCreationSidebar = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { closeRightSidebar } = useLayout();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialCreated, setCredentialCreated] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: "",
    url: "",
    username: "",
    password: "",
    details: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive"
      });
      return;
    }

    if (!formData.type || !formData.url) {
      toast({
        title: "Required fields missing",
        description: "Type and URL are required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("project_credentials")
        .insert({
          project_id: projectId,
          type: formData.type,
          url: formData.url,
          username: formData.username || null,
          password: formData.password || null,
          details: formData.details || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Invalidate credentials query to refresh data
      queryClient.invalidateQueries({ queryKey: ["credentials", projectId] });
      
      setCredentialCreated(true);
      toast({
        title: "Credential added",
        description: "Credential has been successfully added to the project"
      });
    } catch (error: any) {
      console.error("Error adding credential:", error);
      toast({
        title: "Failed to add credential",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setCredentialCreated(false);
    setFormData({
      type: "",
      url: "",
      username: "",
      password: "",
      details: ""
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="font-semibold text-[14px]">
          {credentialCreated ? "Credential Added" : "Add New Credential"}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeRightSidebar}>
          <X size={18} />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {credentialCreated ? (
          <div className="p-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm mb-2">Your credential has been successfully added to the project.</p>
              <div className="flex justify-end mt-4">
                <Button onClick={handleAddAnother}>
                  Add Another Credential
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="type">Credential Type *</Label>
              <Input 
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="e.g., Database, CMS, Website"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="url">URL *</Label>
              <Input 
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username or email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ShieldCheck size={12} />
                <span>Passwords are stored encrypted</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea 
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Add any relevant notes or instructions"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Credential"}
            </Button>
          </form>
        )}
      </ScrollArea>
    </div>
  );
};
