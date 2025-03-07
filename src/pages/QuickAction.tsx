
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { markTaskAsDone } from '@/lib/task-utils';
import { useToast } from '@/hooks/use-toast';

const QuickAction = () => {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // We'll mark task T009 as done
    const executeAction = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No project ID provided",
          variant: "destructive",
        });
        navigate('/projects');
        return;
      }

      const result = await markTaskAsDone('T009', id);
      
      if (result.success) {
        toast({
          title: "Task marked as done",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }

      // Navigate to the project details page
      navigate(`/projects/${id}`);
    };

    executeAction();
  }, [id, navigate, toast]);

  return (
    <div className="container mx-auto p-6 text-center">
      <p>Processing action...</p>
    </div>
  );
};

export default QuickAction;
