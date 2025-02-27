'use client';
import { cn } from '@/lib/utils';
import { Chapters } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

type Props = {
  chapter: Chapters;
  chapterIndex: number;
  completedChapters: Set<String>;
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<String>>>;
};

export type ChapterCardHandler = {
    triggerLoad: () => void;
  };

const ChapterCard = React.forwardRef<ChapterCardHandler, Props>(
({ chapter, chapterIndex, setCompletedChapters, completedChapters }, ref) => {
  const [success, setSuccess] = React.useState<boolean | null>(null);

  const { mutate: getChapterInfo, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/chapter/getInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await response.json();
      return data;
    }
  });

  const addChapterIdToSet = React.useCallback(() => {
    setCompletedChapters((prev) => {
      const newSet = new Set(prev);
      newSet.add(chapter.id);
      return newSet;
    });
  }, [chapter.id, setCompletedChapters]);

  React.useEffect(() => {
    if (chapter.videoId) {
      setSuccess(true);
      addChapterIdToSet;
    }
  }, [chapter, addChapterIdToSet]);

  React.useImperativeHandle(ref, () => ({
    async triggerLoad() {
        if (chapter.videoId) {
            addChapterIdToSet();
            return;
          }
        getChapterInfo(undefined, {
            onSuccess: ({ success }) => {
                setSuccess(success);
                addChapterIdToSet();
              },
              onError: (error) => {
                console.error(error);
                setSuccess(false);
                toast("There was an error loading your chapter");
                addChapterIdToSet();
              },
        })
    },
  }));

  return (
    <div
      key={chapter.id}
      className={cn('px-4 py-2 mt-2 rounded flex justify-between', {
        'bg-secondary': success === null,
        'bg-green-500': success === true,
        'bg-red-500': success === false,
      })}
    >
      <h5>{chapter.name}</h5>
      {isLoading && <Loader2 className="animate-spin" />}
    </div>
  );
});

ChapterCard.displayName = 'ChapterCard';

export default ChapterCard;
