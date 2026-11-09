// src/components/ConversationInbox.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaFilter,
  FaCheck,
  FaReply,
  FaRobot,
  FaUser,
  FaClock,
  FaPaperPlane,
  FaEllipsisV,
  FaTag,
  FaArrowLeft,
  FaComments,
  FaSync,
} from "react-icons/fa";
import Link from "next/link";
import { toast } from "sonner";

interface ConversationItem {
  _id: string;
  pageId: string;
  pageName: string;
  senderPsid: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  status: "ai_replied" | "pending" | "human_replied";
}

interface MessageItem {
  _id: string;
  conversationId: string;
  senderPsid: string;
  senderType: "customer" | "ai" | "human";
  name: string;
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export default function ConversationInbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Poll every 10s for new Facebook messages
    const timer = setInterval(fetchConversations, 10000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c._id === selectedConvId);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedConv) return;

    setSending(true);
    const textToSend = replyText.trim();
    setReplyText("");

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv._id,
          pageId: selectedConv.pageId,
          senderPsid: selectedConv.senderPsid,
          text: textToSend,
        }),
      });

      if (res.ok) {
        toast.success("Reply sent to customer on Facebook!");
        // Append locally
        setMessages((prev) => [
          ...prev,
          {
            _id: `temp-${Date.now()}`,
            conversationId: selectedConv._id,
            senderPsid: selectedConv.senderPsid,
            senderType: "human",
            name: "Agent",
            text: textToSend,
            timestamp: new Date().toISOString(),
          },
        ]);
        fetchConversations();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send message to Facebook");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter === "pending" && c.status !== "pending") return false;
    if (filter === "ai_replied" && c.status !== "ai_replied") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.customerName?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q) ||
        c.pageName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                <FaArrowLeft />
              </Link>
              <h1 className="text-lg font-bold text-foreground">
                Facebook Customer Inbox
              </h1>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Active:</span>
                <span className="font-semibold text-foreground">
                  {conversations.length} conversations
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchConversations();
                }}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground"
              >
                <FaSync className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="pl-9 pr-4 py-1.5 text-xs border border-input rounded-lg bg-background w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Side: Conversation List */}
        <div
          className={`${
            selectedConvId ? "hidden md:block" : "block"
          } w-full md:w-96 border-r border-border bg-background flex flex-col`}
        >
          {/* Filters */}
          <div className="p-3 border-b border-border flex gap-1.5 overflow-x-auto">
            {["all", "unread", "pending", "ai_replied"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize shrink-0 ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <FaComments className="mx-auto h-8 w-8 opacity-30" />
                <p className="font-semibold text-foreground">No conversations yet</p>
                <p>
                  When customers message your connected Facebook Page, conversations and
                  AI auto-replies will appear here in real time.
                </p>
                <Link
                  href="/connect"
                  className="inline-block mt-2 text-primary hover:underline text-xs"
                >
                  View Facebook Connect & Setup
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConvId(conv._id)}
                  className={`p-3.5 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedConvId === conv._id ? "bg-muted" : ""
                  } ${conv.unread ? "font-semibold" : ""}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      {conv.customerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.customerAvatar}
                          alt={conv.customerName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {conv.customerName ? conv.customerName.slice(0, 2).toUpperCase() : "FB"}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
                          conv.status === "ai_replied"
                            ? "bg-emerald-500"
                            : conv.status === "human_replied"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-foreground truncate">
                          {conv.customerName}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                          {conv.pageName}
                        </span>
                        {conv.status === "ai_replied" && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <FaRobot size={9} /> AI Replied
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div
          className={`${
            selectedConvId ? "block" : "hidden md:block"
          } flex-1 flex flex-col bg-card`}
        >
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-background border-b border-border p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden text-muted-foreground hover:text-foreground"
                  >
                    <FaArrowLeft />
                  </button>
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {selectedConv.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-foreground">
                      {selectedConv.customerName}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Facebook Messenger • {selectedConv.pageName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    Auto-Reply Active
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.senderType === "customer" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        msg.senderType === "customer" ? "" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`shrink-0 ${
                          msg.senderType === "customer" ? "mr-2.5" : "ml-2.5"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            msg.senderType === "customer"
                              ? "bg-muted text-foreground border"
                              : msg.senderType === "ai"
                                ? "bg-primary text-primary-foreground"
                                : "bg-emerald-600 text-white"
                          }`}
                        >
                          {msg.senderType === "customer" ? (
                            <FaUser size={11} />
                          ) : msg.senderType === "ai" ? (
                            <FaRobot size={11} />
                          ) : (
                            <FaCheck size={11} />
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                            msg.senderType === "customer"
                              ? "bg-background border shadow-xs text-foreground rounded-tl-xs"
                              : msg.senderType === "ai"
                                ? "bg-primary text-primary-foreground rounded-tr-xs"
                                : "bg-emerald-600 text-white rounded-tr-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div
                          className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 ${
                            msg.senderType === "customer" ? "text-left" : "justify-end"
                          }`}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.senderType === "ai" && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <FaRobot size={9} /> AI Auto-Reply
                            </span>
                          )}
                          {msg.senderType === "human" && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              Manual Reply
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Manual Reply Footer */}
              <div className="bg-background border-t border-border p-3">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a manual reply to send to the customer on Facebook..."
                    className="flex-1 p-2.5 border border-input rounded-lg bg-background text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !replyText.trim()}
                    className="self-end bg-primary text-primary-foreground p-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaPaperPlane className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> to send
                  directly to Facebook Messenger.
                </p>
              </div>
            </>
          ) : (
            /* Empty Chat State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                <FaComments className="text-2xl" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Select a conversation
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-6">
                Choose a customer from the left to view the messages, see AI replies, and
                send manual messages to Facebook Messenger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
