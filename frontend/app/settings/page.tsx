'use client';

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  User,
  Bell,
  Shield,
  Palette,
  Link as LinkIcon,
  Save
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Favour" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Olaboye" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="favour@example.com" />
            </div>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Compact Mode</p>
                <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Animations</p>
                <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications about new emails</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Calendar Reminders</p>
                <p className="text-sm text-muted-foreground">Get reminders for upcoming events</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Task Updates</p>
                <p className="text-sm text-muted-foreground">Notifications when tasks are updated</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">AI Insights</p>
                <p className="text-sm text-muted-foreground">Daily AI-generated productivity insights</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <LinkIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Gmail</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="rounded-lg border border-border backdrop-blur-sm bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Privacy & Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Data Export</p>
                <p className="text-sm text-muted-foreground">Download your data</p>
              </div>
              <Button variant="outline" size="sm">Export</Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

