
import React, { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Folder, Plus, Save, Search, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock initial notes
const initialNotes: Note[] = [
  {
    id: "1",
    title: "Physics Lecture Notes",
    content: "<h2>Introduction to Mechanics</h2><p>Newton's three laws of motion form the foundation of classical mechanics:</p><ol><li>An object at rest stays at rest, and an object in motion stays in motion unless acted upon by a force.</li><li>Force equals mass times acceleration (F = ma).</li><li>For every action, there is an equal and opposite reaction.</li></ol>",
    createdAt: new Date("2023-04-10"),
    updatedAt: new Date("2023-04-12"),
  },
  {
    id: "2",
    title: "Chemistry Study Guide",
    content: "<h2>Periodic Table Elements</h2><p>Key groups to remember:</p><ul><li>Alkali Metals (Group 1)</li><li>Alkaline Earth Metals (Group 2)</li><li>Halogens (Group 17)</li><li>Noble Gases (Group 18)</li></ul><p>Transition metals occupy the central block of the periodic table.</p>",
    createdAt: new Date("2023-04-05"),
    updatedAt: new Date("2023-04-07"),
  },
  {
    id: "3",
    title: "Literature Analysis",
    content: "<h2>Theme Analysis: Symbolism in Literature</h2><p>Symbolism is a literary device where objects, characters, or actions represent abstract ideas or concepts.</p><p>Common symbols include:</p><ul><li>Light/Darkness - Knowledge/Ignorance</li><li>Water - Rebirth/Purification</li><li>Colors - Various emotions and concepts</li></ul>",
    createdAt: new Date("2023-04-01"),
    updatedAt: new Date("2023-04-03"),
  },
];

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const quillRef = useRef<ReactQuill>(null);

  // Filter notes based on search term
  const filteredNotes = notes.filter(
    note => note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNoteSelect = (note: Note) => {
    // Save current note first if there's one selected
    if (selectedNote && editorContent !== selectedNote.content) {
      handleSaveNote();
    }
    
    setSelectedNote(note);
    setEditorContent(note.content);
  };

  const handleCreateNewNote = () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
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
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
    
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
      setEditorContent("");
    }

    toast({
      title: "Note deleted",
      description: "Your note has been deleted.",
    });
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;

    const updatedNotes = notes.map(note => {
      if (note.id === selectedNote.id) {
        return {
          ...note,
          content: editorContent,
          updatedAt: new Date(),
        };
      }
      return note;
    });

    setNotes(updatedNotes);
    setSelectedNote({
      ...selectedNote,
      content: editorContent,
      updatedAt: new Date(),
    });

    toast({
      title: "Note saved",
      description: "Your note has been saved successfully.",
    });
  };

  // Configure Quill editor modules and formats
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image', 'color', 'background',
  ];

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
              
              {filteredNotes.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-md cursor-pointer flex justify-between items-start transition-colors ${
                        selectedNote?.id === note.id
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
                          selectedNote?.id === note.id
                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                            : "hover:bg-muted-foreground/20"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
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
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={editorContent}
                    onChange={setEditorContent}
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
                </div>
                <Button onClick={handleSaveNote}>
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
