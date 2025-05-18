
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "@/context/layout";
import { Eye, EyeOff, X } from "lucide-react";

export const CredentialCreationSidebar = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { setRightSidebarContent } = useLayout();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    type: '',
    url: '',
    username: '',
    password: '',
    details: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.type || !formData.url) {
      toast({
        title: "Validation Error",
        description: "Type and URL are required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('project_credentials')
        .insert([
          {
            project_id: projectId,
            type: formData.type,
            url: formData.url,
            username: formData.username || null,
            password: formData.password || null,
            details: formData.details || null,
            is_encrypted: true
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Credential Added",
        description: `Successfully added ${formData.type} credentials`,
      });
      
      // Reset the form and close the sidebar
      setFormData({
        type: '',
        url: '',
        username: '',
        password: '',
        details: ''
      });
      
      // Invalidate credentials query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['credentials', projectId] });
      
      // Close the sidebar
      setRightSidebarContent(null);
      
    } catch (error) {
      console.error('Error adding credential:', error);
      toast({
        title: "Error",
        description: "Failed to add credential. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="h-full flex flex-col">
     
      <div className=" flex justify-between items-center px-4 border-b sticky top-0 z-20 py-2 bg-background">
        <h2 className="text-sm text-gray-500 ">Add Credential</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setRightSidebarContent(null)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <Label htmlFor="type">Credential Type</Label>
          <Input
            id="type"
            name="type"
            placeholder="e.g. Google Account, FTP, Website Admin"
            value={formData.type}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            placeholder="https://example.com"
            type="url"
            value={formData.url}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="username@example.com"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="details">Additional Details</Label>
          <Textarea
            id="details"
            name="details"
            placeholder="Any additional information about this credential"
            value={formData.details}
            onChange={handleChange}
            rows={3}
          />
        </div>

        
        <div className="flex flex-col pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Credential"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CredentialCreationSidebar;
