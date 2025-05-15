
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface OverviewTabProps {
  projectId: string;
}

const OverviewTab = ({ projectId }: OverviewTabProps) => {
  const { data: project, isLoading } = useQuery({
    queryKey: ['project-overview', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          status:task_statuses(name, color_hex),
          primary_color_hex,
          secondary_color_hex,
          progress
        `)
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
  
  if (isLoading) {
    return <Card className="p-6">Loading project details...</Card>;
  }
  
  if (!project) {
    return <Card className="p-6">Project details not found</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Project Details</h3>
            <p className="text-gray-500 mt-1">{project.details || 'No details provided'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Status</h4>
              <span 
                className="inline-block px-2 py-1 rounded-full text-xs mt-1"
                style={{
                  backgroundColor: `${project.status?.color_hex}15`,
                  color: project.status?.color_hex
                }}
              >
                {project.status?.name || 'Unknown'}
              </span>
            </div>
            
            <div>
              <h4 className="font-medium">Progress</h4>
              <p className="text-gray-500 mt-1">{project.progress || 0}%</p>
            </div>
            
            {project.primary_color_hex && (
              <div>
                <h4 className="font-medium">Brand Colors</h4>
                <div className="flex gap-2 mt-1">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: project.primary_color_hex }}
                    title="Primary Color"
                  />
                  {project.secondary_color_hex && (
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: project.secondary_color_hex }}
                      title="Secondary Color"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OverviewTab;
