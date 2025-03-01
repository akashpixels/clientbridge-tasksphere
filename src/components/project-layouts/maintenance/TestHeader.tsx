
import { Tables } from "@/integrations/supabase/types";

interface TestHeaderProps {
  project: any;
  monthlyHours: number;
}

const TestHeader = ({ project, monthlyHours }: TestHeaderProps) => {
  // Extract relevant data for debugging
  const subscription = project.project_subscriptions?.[0];
  
  return (
    <div className="p-4 my-4 bg-gray-100 rounded-lg border border-gray-300">
      <h2 className="text-lg font-bold mb-4">Debug Data</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium">Project Data:</h3>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify({
              id: project.id,
              name: project.name,
              layout_id: project.layout_id
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium">Subscription Data:</h3>
          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Monthly Hours:</h3>
        <p>{monthlyHours}</p>
      </div>
      
      <div className="mt-4">
        <h3 className="font-medium">All Project Subscriptions:</h3>
        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
          {JSON.stringify(project.project_subscriptions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestHeader;
