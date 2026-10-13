"use client";

import React, { useState, useEffect } from "react";
import {
  Table2,
  LayoutGrid,
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  Tag,
  CheckCircle,
  Hash,
  Type,
} from "lucide-react";
import { DatabaseDetail, DatabaseRow, DatabaseProperty, api } from "@/lib/api";

interface DatabaseViewProps {
  database: DatabaseDetail;
  onRefresh?: () => void;
}

export function DatabaseView({ database, onRefresh }: DatabaseViewProps) {
  const [viewType, setViewType] = useState<"table" | "board">("table");
  const [rows, setRows] = useState<DatabaseRow[]>(database.rows || []);
  const [properties, setProperties] = useState<DatabaseProperty[]>(database.properties || []);
  const [newRowTitle, setNewRowTitle] = useState("");
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("text");

  useEffect(() => {
    setRows(database.rows || []);
    setProperties(database.properties || []);
  }, [database]);

  const handleCellChange = async (rowId: string, propertyId: string, value: any) => {
    // Optimistic UI update
    const updatedRows = rows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          cells: { ...r.cells, [propertyId]: value },
        };
      }
      return r;
    });
    setRows(updatedRows);

    try {
      await api.updateDatabaseCell(rowId, propertyId, value);
    } catch (err) {
      console.error("Failed to update cell", err);
    }
  };

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRowTitle.trim()) return;

    const titleProp = properties.find((p) => p.type === "title") || properties[0];
    const initialCells: Record<string, any> = {};
    if (titleProp) {
      initialCells[titleProp.id] = newRowTitle.trim();
    }

    try {
      const createdRow = await api.createDatabaseRow(database.id, initialCells);
      setRows([...rows, createdRow]);
      setNewRowTitle("");
    } catch (err) {
      console.error("Failed to create row", err);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    setRows(rows.filter((r) => r.id !== rowId));
    try {
      await api.deleteDatabaseRow(rowId);
    } catch (err) {
      console.error("Failed to delete row", err);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    try {
      const prop = await api.addDatabaseProperty(database.id, newPropName.trim(), newPropType);
      setProperties([...properties, prop]);
      setNewPropName("");
      setShowAddProperty(false);
    } catch (err) {
      console.error("Failed to add property", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-surface-card text-muted-foreground border-border";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const renderCellInput = (row: DatabaseRow, prop: DatabaseProperty) => {
    const val = row.cells[prop.id] || "";

    if (prop.type === "status") {
      return (
        <select
          value={val}
          onChange={(e) => handleCellChange(row.id, prop.id, e.target.value)}
          className={`px-2 py-0.5 rounded text-xs font-medium border outline-none bg-transparent ${getStatusColor(val)}`}
        >
          <option value="todo" className="bg-surface-popover text-foreground">To Do</option>
          <option value="in_progress" className="bg-surface-popover text-foreground">In Progress</option>
          <option value="done" className="bg-surface-popover text-foreground">Done</option>
        </select>
      );
    }

    if (prop.type === "select") {
      return (
        <select
          value={val}
          onChange={(e) => handleCellChange(row.id, prop.id, e.target.value)}
          className={`px-2 py-0.5 rounded text-xs font-medium border outline-none bg-transparent ${getPriorityColor(val)}`}
        >
          <option value="low" className="bg-surface-popover text-foreground">Low</option>
          <option value="medium" className="bg-surface-popover text-foreground">Medium</option>
          <option value="high" className="bg-surface-popover text-foreground">High</option>
        </select>
      );
    }

    if (prop.type === "date") {
      return (
        <input
          type="date"
          value={val}
          onChange={(e) => handleCellChange(row.id, prop.id, e.target.value)}
          className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
        />
      );
    }

    return (
      <input
        type="text"
        value={val}
        onChange={(e) => handleCellChange(row.id, prop.id, e.target.value)}
        placeholder="Empty"
        className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground/40 outline-none"
      />
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Database Title & View Switcher Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{database.icon || "📊"}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{database.name}</h2>
            {database.description && (
              <p className="text-xs text-muted-foreground">{database.description}</p>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-surface-card p-1 rounded-lg border border-border">
          <button
            onClick={() => setViewType("table")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewType === "table" ? "bg-surface-hover text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 size={13} />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewType("board")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewType === "board" ? "bg-surface-hover text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid size={13} />
            <span>Kanban Board</span>
          </button>
        </div>
      </div>

      {/* View 1: Table View */}
      {viewType === "table" && (
        <div className="overflow-x-auto border border-border rounded-xl bg-surface-card/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-card/80 text-muted-foreground font-semibold">
                {properties.map((prop) => (
                  <th key={prop.id} className="p-3 border-r border-border font-medium min-w-[150px]">
                    <div className="flex items-center space-x-1.5">
                      {prop.type === "title" ? <Type size={13} /> : prop.type === "status" ? <CheckCircle size={13} /> : prop.type === "date" ? <Calendar size={13} /> : <Tag size={13} />}
                      <span>{prop.name}</span>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-12 text-center">
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="p-1 hover:bg-surface-hover rounded text-muted-foreground hover:text-foreground"
                    title="Add Property"
                  >
                    <Plus size={14} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-surface-hover/40 transition-colors">
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3 border-r border-border/60">
                      {renderCellInput(row, prop)}
                    </td>
                  ))}
                  <td className="p-2 text-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 text-muted-foreground hover:text-rose-500 rounded"
                      title="Delete record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick Add Row Input Footer */}
          <form onSubmit={handleAddRow} className="flex items-center p-2.5 bg-surface-card/60 border-t border-border space-x-2">
            <Plus size={14} className="text-muted-foreground" />
            <input
              type="text"
              value={newRowTitle}
              onChange={(e) => setNewRowTitle(e.target.value)}
              placeholder="Add new record..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none"
            />
            <button
              type="submit"
              disabled={!newRowTitle.trim()}
              className="px-3 py-1 bg-brand text-brand-foreground rounded text-xs font-semibold disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* View 2: Kanban Board View */}
      {viewType === "board" && (
        <div className="grid grid-cols-3 gap-4">
          {["todo", "in_progress", "done"].map((colStatus) => {
            const colTitle = colStatus === "todo" ? "To Do" : colStatus === "in_progress" ? "In Progress" : "Done";
            const statusProp = properties.find((p) => p.type === "status") || properties[1];
            const titleProp = properties.find((p) => p.type === "title") || properties[0];
            const priorityProp = properties.find((p) => p.name === "Priority" || p.type === "select");
            const dateProp = properties.find((p) => p.type === "date");

            const colRows = rows.filter((r) => (r.cells[statusProp?.id || ""] || "todo") === colStatus);

            return (
              <div key={colStatus} className="bg-surface-card/40 border border-border rounded-xl p-3 flex flex-col space-y-3 min-h-[360px]">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${colStatus === "done" ? "bg-emerald-500" : colStatus === "in_progress" ? "bg-blue-500" : "bg-slate-400"}`} />
                    <span className="text-xs font-bold text-foreground">{colTitle}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-hover text-muted-foreground">
                      {colRows.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {colRows.map((r) => {
                    const rowTitle = r.cells[titleProp?.id || ""] || "Untitled Task";
                    const priorityVal = priorityProp ? r.cells[priorityProp.id] : null;
                    const dateVal = dateProp ? r.cells[dateProp.id] : null;

                    return (
                      <div
                        key={r.id}
                        className="bg-surface-popover border border-border/80 hover:border-brand/40 p-3 rounded-lg shadow-sm space-y-2 group transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-semibold text-foreground">{rowTitle}</span>
                          <button
                            onClick={() => handleDeleteRow(r.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-rose-500 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          {priorityVal && (
                            <span className={`px-2 py-0.5 rounded font-medium border ${getPriorityColor(priorityVal)}`}>
                              {priorityVal}
                            </span>
                          )}
                          {dateVal && (
                            <span className="flex items-center space-x-1 text-muted-foreground">
                              <Calendar size={11} />
                              <span>{dateVal}</span>
                            </span>
                          )}
                        </div>

                        {/* Move state triggers */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {colStatus !== "todo" && (
                            <button
                              onClick={() => statusProp && handleCellChange(r.id, statusProp.id, "todo")}
                              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-surface-hover"
                            >
                              ← To Do
                            </button>
                          )}
                          {colStatus !== "in_progress" && (
                            <button
                              onClick={() => statusProp && handleCellChange(r.id, statusProp.id, "in_progress")}
                              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-surface-hover"
                            >
                              In Progress
                            </button>
                          )}
                          {colStatus !== "done" && (
                            <button
                              onClick={() => statusProp && handleCellChange(r.id, statusProp.id, "done")}
                              className="text-[10px] text-muted-foreground hover:text-emerald-500 px-1.5 py-0.5 rounded bg-surface-hover"
                            >
                              Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddProperty} className="bg-surface-popover border border-border rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-foreground">Add Custom Property</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Property Name</label>
              <input
                type="text"
                value={newPropName}
                onChange={(e) => setNewPropName(e.target.value)}
                placeholder="e.g. Assignee, URL, Rating"
                className="w-full bg-surface-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Property Type</label>
              <select
                value={newPropType}
                onChange={(e) => setNewPropType(e.target.value)}
                className="w-full bg-surface-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="text">Text</option>
                <option value="select">Select</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProperty(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-brand text-brand-foreground rounded text-xs font-semibold"
              >
                Add Property
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
