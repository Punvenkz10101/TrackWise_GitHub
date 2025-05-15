import React, { useState, useRef, useEffect, useMemo, forwardRef, useCallback, RefObject } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Folder, Plus, Save, Search, Trash2 } from "lucide-react";
import { notesAPI } from "@/lib/api";

interface Note {
  _id: string; // Changed from id to _id to match MongoDB
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Better typed wrapper for ReactQuill to handle refs properly
interface QuillEditorProps {
  theme?: string;
  value: string;
  onChange: (value: string) => void;
  modules?: unknown;
  formats?: string[];
  className?: string;
}

// Create a properly typed forwardRef wrapper for ReactQuill
const QuillEditor = forwardRef<ReactQuill, QuillEditorProps>((props, ref) => {
  return <ReactQuill {...props} ref={ref} />;
});

QuillEditor.displayName = 'QuillEditor';

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const quillRef = useRef<ReactQuill>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notes on component mount
  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);
        const response = await notesAPI.getAllNotes();
        // Convert string dates to Date objects
        const formattedNotes = response.map((note: Note) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(formattedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        
        // Show different message for auth errors
        if (error instanceof Error && error.message === 'Authentication failed') {
          toast({
            title: "Authentication Error",
            description: "Your session may have expired. Please refresh the page or log in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load notes",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  // Filter notes based on search term
  const filteredNotes = notes.filter(
    note => note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNoteSelect = (note: Note) => {
    // If there's a pending auto-save, clear it
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Save current note first if there's one selected
    if (selectedNote && editorContent !== selectedNote.content) {
      // Use the extracted save function
      saveNote(selectedNote, editorContent);
    }
    
    setSelectedNote(note);
    setEditorContent(note.content);
  };

  const handleCreateNewNote = async () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating new note with title:', newNoteTitle);
      const response = await notesAPI.createNote({
        title: newNoteTitle,
        content: ""
      });

      const newNote = {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt)
      };

      setNotes([...notes, newNote]);
      setSelectedNote(newNote);
      setEditorContent("");
      setNewNoteTitle("");
      setIsCreatingNote(false);

      toast({
        title: "Note created",
        description: "Your new note has been created.",
      });
    } catch (error) {
      console.error("Error creating note:", error);
      
      // Display more informative error message
      let errorMessage = "Failed to create note";
      let errorTitle = "Error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error cases
        if (errorMessage.includes('user ID format')) {
          errorTitle = "Authentication Error";
          errorMessage = "Your session may have expired. Please refresh the page.";
        } else if (errorMessage.includes('content')) {
          // Handle content validation errors
          errorTitle = "Content Error";
          errorMessage = "There was an issue with the note content. Please try again.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      console.log('Deleting note with ID:', noteId);
      await notesAPI.deleteNote(noteId);
      
      setNotes(notes.filter(note => note._id !== noteId));
      
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote(null);
        setEditorContent("");
      }

      toast({
        title: "Note deleted",
        description: "Your note has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      
      // Display more informative error message
      let errorMessage = "Failed to delete note";
      let errorTitle = "Error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (errorMessage.includes('Invalid note ID format')) {
          errorTitle = "Invalid Note ID";
          errorMessage = "The note ID format is invalid.";
        } else if (errorMessage.includes('Note not found')) {
          errorTitle = "Note Not Found";
          errorMessage = "The note may have been already deleted.";
          
          // Remove from state if not found on server
          setNotes(notes.filter(note => note._id !== noteId));
          
          if (selectedNote && selectedNote._id === noteId) {
            setSelectedNote(null);
            setEditorContent("");
          }
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    
    // Clear any pending auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Use the extracted saveNote function
    await saveNote(selectedNote, editorContent);
  };

  // Debounced auto-save function
  const debounceSave = useCallback((note: Note, content: string) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save after 1500ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(note, content);
    }, 1500);
  }, []);

  // Extracted save note logic for reuse
  const saveNote = async (note: Note, content: string) => {
    if (!note) return;
    
    setIsSaving(true);
    try {
      console.log('Auto-saving note with ID:', note._id);
      const noteData = {
        title: note.title,
        content: content
      };

      const updatedNote = await notesAPI.updateNote(note._id, noteData);

      if (updatedNote) {
        const formattedNote = {
          ...updatedNote,
          createdAt: new Date(updatedNote.createdAt),
          updatedAt: new Date(updatedNote.updatedAt)
        };

        // Update the notes array with the updated note
        setNotes(prevNotes => prevNotes.map(existingNote => 
          existingNote._id === note._id ? formattedNote : existingNote
        ));
        
        // Update selected note if it's the currently edited one
        if (selectedNote && selectedNote._id === note._id) {
          setSelectedNote(formattedNote);
        }

        toast({
          title: "Note saved",
          description: "Your changes have been saved.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error auto-saving note:", error);
      
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editor content change with auto-save
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    
    // Auto-save if we have a selected note
    if (selectedNote) {
      debounceSave(selectedNote, content);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Configure Quill editor modules and formats
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image', 'color', 'background',
  ], []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
            <p className="text-muted-foreground">
              Organize and access your study notes
            </p>
          </div>
          <Button onClick={() => setIsCreatingNote(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notes list sidebar */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>My Notes</CardTitle>
              <CardDescription>
                {notes.length} notes
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100vh-300px)] overflow-auto">
              {isCreatingNote && (
                <div className="p-4 mb-2 border rounded-md">
                  <Input
                    placeholder="Note title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingNote(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateNewNote}>
                      Create
                    </Button>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center p-4">
                  Loading notes...
                </div>
              ) : filteredNotes.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <div
                      key={note._id}
                      className={`p-3 rounded-md cursor-pointer flex justify-between items-start transition-colors ${
                        selectedNote?._id === note._id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleNoteSelect(note)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                          <h3 className="font-medium truncate">{note.title}</h3>
                        </div>
                        <p className="text-xs mt-1 truncate">
                          Updated {note.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`ml-2 ${
                          selectedNote?._id === note._id
                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                            : "hover:bg-muted-foreground/20"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No notes match your search"
                      : "No notes yet. Create your first note!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note editor */}
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle>
                {selectedNote ? selectedNote.title : "Note Editor"}
              </CardTitle>
              {selectedNote && (
                <CardDescription>
                  Last updated: {selectedNote.updatedAt.toLocaleString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="h-[calc(100vh-300px)] overflow-auto">
              {selectedNote ? (
                <div className="h-full">
                  <QuillEditor
                    ref={quillRef}
                    theme="snow"
                    value={editorContent}
                    onChange={handleEditorChange}
                    modules={modules}
                    formats={formats}
                    className="h-[calc(100%-50px)]"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">
                    Select a note from the sidebar or create a new one to start editing
                  </p>
                </div>
              )}
            </CardContent>
            {selectedNote && (
              <CardFooter className="flex justify-between">
                <div className="text-xs text-muted-foreground">
                  Created: {selectedNote.createdAt.toLocaleDateString()}
                  {isSaving && <span className="ml-2 text-muted-foreground">(Saving...)</span>}
                </div>
                <Button onClick={handleSaveNote} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotesPage;
