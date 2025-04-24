
export interface Article {
  id: string;
  title: string;
  description: string;
  categoryId: string; // Changed from category to categoryId
  tags: string[];
  views: number;
  date: string;
  favorite: boolean;
  content: string;
  pinned?: boolean;
  author: {
    name: string;
    avatar: string;
  };
}

export interface Category {
  id: string; // Added id property
  name: string;
  icon: JSX.Element;
  count: number;
  color: string; // Added color property
}
