export interface Note {
    id: string; 
    title: string;
    author: {
        name: string;
        email: string;
    } | null;
    content: string;
}