
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommentCountProps {
  taskId: string;
  onClick: () => void;
}

export const CommentCount = ({ taskId, onClick }: CommentCountProps) => {
  const { data } = useQuery({
    queryKey: ['commentCount', taskId],
    queryFn: async () => {
      if (!taskId) return { total: 0, new: 0 };

      const [{ count: total }, { data: views }] = await Promise.all([
        supabase
          .from('task_comments')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', taskId),
        supabase
          .from('task_comment_views')
          .select('last_viewed_at')
          .eq('task_id', taskId)
          .single()
      ]);

      const lastViewed = views?.last_viewed_at;
      
      const { count: newCount } = await supabase
        .from('task_comments')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId)
        .gt('created_at', lastViewed || '1970-01-01');

      return {
        total: total || 0,
        new: newCount || 0
      };
    },
    enabled: Boolean(taskId),
  });

  if (!data?.total) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="text-sm">{data.total}</span>
      {data.new > 0 && (
        <span className="bg-blue-500 text-white text-xs px-1.5 rounded-full">
          {data.new}
        </span>
      )}
    </button>
  );
};
