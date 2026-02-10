import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
//import html2pdf from 'html2pdf.js';
import './App.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Define the shape of each CSV record
type NametagData = {
  id: string;
  Name1: string;
  Name2: string;
  Yr: string;
  Child: string;
  USE_Advanced: string;
  Acad_Orgs: string;
};

type NametagWithSelection = NametagData & {
  selected: boolean;
};

type Event = {
  id: string;
  name: string;
  tags: NametagWithSelection[];
  createdAt: Date;
};

// Helper to split array into pages of N items
const chunkArray = <T extends unknown>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

function App() {
  // Load events on startup
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('nametag-events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved events:', e);
        return [];
      }
    }
    return [];
  });

  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [tags, setTags] = useState<NametagWithSelection[]>([]); // 👈 REMOVE localStorage loading
  const [showingSelectedOnly, setShowingSelectedOnly] = useState(false);
  const [showDebugBorders, setShowDebugBorders] = useState(true);

  // Save events to LocalStorage whenever events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('nametag-events', JSON.stringify(events));
    }
  }, [events]);

  // Auto-save current tags to current event
  useEffect(() => {
    if (currentEventId && tags.length > 0) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === currentEventId ? { ...event, tags: tags } : event
        )
      );
    }
  }, [tags, currentEventId]);

  // Turns off the show selected only filter when no tags are selected
  useEffect(() => {
    if (showingSelectedOnly && tags.every((t) => !t.selected)) {
      setShowingSelectedOnly(false);
    }
  }, [tags, showingSelectedOnly]);

  // Updates (Creates) array of tags with specified field of the specified tag updated
  const updateTagField = (
    id: string,
    field: keyof NametagData,
    value: string
  ) => {
    setTags((tags) =>
      tags.map((tag) => (tag.id === id ? { ...tag, [field]: value } : tag))
    );
  };

  // Creates a new event
  const createNewEvent = () => {
    const name = prompt('Enter event name:');
    if (!name) return;

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: name,
      tags: [],
      createdAt: new Date(),
    };

    setEvents([...events, newEvent]);
    setCurrentEventId(newEvent.id);
    setTags([]);
  };

  // Switches to event and renders event tags
  const switchToEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setCurrentEventId(eventId);
      setTags(event.tags);
    }
  };

  // Deletes an event by removing it from the state
  const deleteEvent = (eventId: string) => {
    if (!window.confirm('Delete this event?')) return;

    // new array that excludes the event with the given ID
    setEvents(events.filter((e) => e.id !== eventId));

    // clear active event if deleted
    if (currentEventId === eventId) {
      setCurrentEventId(null);
      setTags([]);
    }
  };

  const renameEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const newName = prompt('Rename event:', event.name);
    if (!newName) return;

    setEvents(
      events.map((e) => (e.id === eventId ? { ...e, name: newName } : e))
    );
  };

  const FIELD_ALIASES: Record<keyof NametagData, string[]> ={
    Name1: ['Name1','First Name' ],
    Name2: ['Name2', 'Last Name'],
    Yr: ['Yr', 'Year'],
    Child: ['Child', 'Child Tag'],
    USE_Advanced: ['USE_Advanced', 'Advanced Degree', ],
    Acad_Orgs: ['Acad_Orgs','Colleges'],
    id: ['ConstituentId', 'Common Id','CUID']
  };

  // Imports CSV of nametags
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentEventId) return;

    let append = false;

    if (tags.length > 0) {
      append = window.confirm(
        `You already have ${tags.length} nametags loaded.\n\n` +
          `Click OK to ADD these new tags.\n` +
          `Click Cancel to REPLACE all existing tags.`
      );
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.replace(/`/g, "'"),
      complete: (results) => {
        console.log('Raw CSV rows:', results.data);
        const newTags: NametagWithSelection[] = results.data.map((row: any, idx: number) => {
          const tag: any = {};
  
          // Map CSV headers to internal fields
          (Object.keys(FIELD_ALIASES) as (keyof NametagData)[]).forEach((field) => {
            const aliases = FIELD_ALIASES[field];
            for (const alias of aliases) {
              if (row[alias] !== undefined) {
                tag[field] = row[alias];
                break;
              }
            }
            if (!tag[field]) tag[field] = ''; // fallback
          });
  
          tag.selected = false;
  
          // fallback id if CSV doesn't provide one
          if (!tag.id) tag.id = `tag-${append ? tags.length + idx : idx}`;
  
          return tag as NametagWithSelection;
        });
  
        setTags(append ? [...tags, ...newTags] : newTags);
      },
    });
  
    e.target.value = '';
  };

  const showSelectedOnly = () => {
    const selectedCount = tags.filter((t) => t.selected).length;
    if (selectedCount === 0) {
      alert('Please select at least one nametag.');
      return;
    }
    setShowingSelectedOnly(true);
  };

  /*const showAll = () => {
    setShowingSelectedOnly(false);
  };*/

  const displayedTags = showingSelectedOnly
    ? tags.filter((t) => t.selected)
    : tags;

  const toggleSelection = (id: string) => {
    setTags(
      tags.map((tag) =>
        tag.id === id ? { ...tag, selected: !tag.selected } : tag
      )
    );
  };

  const selectAll = () => {
    setTags(tags.map((tag) => ({ ...tag, selected: true })));
  };

  const deselectAll = () => {
    setTags(tags.map((tag) => ({ ...tag, selected: false })));
  };

  const clearData = () => {
    if (!currentEventId) return;

    if (
      window.confirm(
        'Are you sure you want to clear all nametags from this event?'
      )
    ) {
      setTags([]);
      // Update the event to have empty tags
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === currentEventId ? { ...event, tags: [] } : event
        )
      );
    }
  };

  const downloadPDF = async () => {
    const allSheets = document.querySelectorAll('.all-sheets .sheet');

    if (allSheets.length === 0) return;

    const pdf = new jsPDF({
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
    });

    for (let i = 0; i < allSheets.length; i++) {
      const sheet = allSheets[i] as HTMLElement;

      const canvas = await html2canvas(sheet, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);
    }

    pdf.save('all-nametags.pdf');
  };

  const selectedCount = tags.filter((t) => t.selected).length;

  return (
    <div className={`App ${showDebugBorders ? 'debug-borders' : ''}`}>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <span id="app-title" className="d-none d-md-block">
            AAD Nametag Generator
          </span>
          {/* Optional: Add Cornell logo if you have it */}
          {/* <a className="navbar-brand p-0 m-0" href="/">
          <img src="cornell-seal.svg" alt="Cornell Logo" height="45" className="d-inline-block align-text-top">
        </a> */}
        </div>
      </nav>
      {/* Event Management Section */}
      <div
        className="event-management"
        style={{
          marginBottom: '20px',
          padding: '10px',
          border: '1px solid #ccc',
        }}
      >
        <div className="container">
          <h3>Events</h3>
          <button onClick={createNewEvent}>+ New Event</button>

          {events.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label>Switch to event: </label>
              <select
                value={currentEventId || ''}
                onChange={(e) => switchToEvent(e.target.value)}
              >
                <option value="">-- Select Event --</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.tags.length} tags)
                  </option>
                ))}
              </select>

              {currentEventId && (
                <>
                  <button onClick={() => renameEvent(currentEventId)}>
                    Rename
                  </button>
                  <button onClick={() => deleteEvent(currentEventId)}>
                    Delete Event
                  </button>
                </>
              )}
            </div>
          )}

          {currentEventId && (
            <div style={{ marginTop: '10px' }}>
              <strong>Current Event: </strong>
              {events.find((e) => e.id === currentEventId)?.name}
            </div>
          )}
        </div>
      </div>
      {/* Only show file upload and controls if an event is selected */}
      {currentEventId ? (
        <div className="container">
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button onClick={downloadPDF}>Download PDF</button>
          <button onClick={showSelectedOnly}>
            Show Selected ({selectedCount})
          </button>

          {tags.length > 0 && (
            <>
              <button onClick={selectAll}>Select All</button>
              <button onClick={deselectAll}>Deselect All</button>
              <button onClick={() => setShowDebugBorders(!showDebugBorders)}>
                {showDebugBorders ? 'Hide' : 'Show'} Debug Borders
              </button>
              <button onClick={clearData}>Clear All Data</button>
            </>
          )}
        </div>
      ) : (
        <div className="container">
          <p>Create or select an event to get started.</p>
        </div>
      )}

      {/* ... rest of your existing JSX ... */}

      <div className="all-sheets">
        <div className="container">
          {chunkArray(displayedTags, 3).map((sheetTags, sheetIdx) => (
            <div className="sheet" key={sheetIdx}>
              {sheetTags.map((person, idx) => (
                <React.Fragment key={idx}>
                  <div className="person-container">
                    {/* Left tag for this person */}
                    <div className="nametag">
                      {/* Line 1: First name only */}
                      <div
                        className="name1"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateTagField(
                            person.id,
                            'Name1',
                            e.currentTarget.textContent || ''
                          )
                        }
                      >
                        {person.Name1}
                      </div>

                      {/* Line 2: Last name + Year + Child */}
                      <div className="name2line">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            updateTagField(
                              person.id,
                              'Name2',
                              e.currentTarget.textContent || ''
                            )
                          }
                          style={{ display: 'inline' }}
                        >
                          {person.Name2}
                        </div>
                        {person.Yr && (
                          <>
                            {' '}
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateTagField(
                                  person.id,
                                  'Yr',
                                  e.currentTarget.textContent || ''
                                )
                              }
                              style={{ display: 'inline' }}
                            >
                              {person.Yr}
                            </div>
                          </>
                        )}
                        {person.Child && (
                          <>
                            {''}
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateTagField(
                                  person.id,
                                  'Child',
                                  e.currentTarget.textContent || ''
                                )
                              }
                              style={{ display: 'inline' }}
                            >
                              {person.Child}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Line 3: Advanced degree */}
                      <div
                        className="useAdvanced"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateTagField(
                            person.id,
                            'USE_Advanced',
                            e.currentTarget.textContent || ''
                          )
                        }
                      >
                        {person.USE_Advanced}
                      </div>

                      {/* Line 4: Academic organizations */}
                      <div
                        className="acadOrgs"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {person.Acad_Orgs}
                      </div>
                    </div>

                    {/* Right tag for this person (identical) */}
                    <div className="nametag">
                      <input
                        type="checkbox"
                        checked={person.selected}
                        onChange={() => toggleSelection(person.id)}
                        className="nametag-checkbox"
                      />
                      {/* Line 1: First name only */}
                      <div className="name1">{person.Name1}</div>

                      {/* Line 2: Last name + Year + Child */}
                      <div
                        className="name2line"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {person.Name2}
                        {person.Yr ? ` ${person.Yr}` : ''}
                        {person.Child ? `${person.Child}` : ''}
                      </div>

                      {/* Line 3: Advanced degree */}
                      <div
                        className="useAdvanced"
                        suppressContentEditableWarning
                      >
                        {person.USE_Advanced}
                      </div>

                      {/* Line 4: Academic organizations */}
                      <div
                        className="acadOrgs"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {person.Acad_Orgs}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
