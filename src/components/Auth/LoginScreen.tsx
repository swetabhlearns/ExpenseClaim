import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
    setCurrentUserId: (userId: string) => void;
}

export function LoginScreen({ setCurrentUserId }: LoginScreenProps) {
    const users = useQuery(api.users.listUsers);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!users) {
        return (
            <div className="min-h-screen app-background flex items-center justify-center">
                <p className="text-white">Loading...</p>
            </div>
        );
    }

    const handleLogin = () => {
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        // Find user by email
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            setError('Invalid email or password');
            return;
        }

        // For demo purposes, accept any password
        // In production, you'd verify the password hash
        if (password.length < 1) {
            setError('Please enter a password');
            return;
        }

        setCurrentUserId(user._id);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen app-background flex items-center justify-center p-6">
            <Card className="w-full max-w-md animate-slide-up">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading">Expense Claim Portal</CardTitle>
                    <CardDescription>
                        Sign in to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            placeholder="your.email@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>

                    <Button onClick={handleLogin} className="w-full" size="lg">
                        Sign In
                    </Button>

                    <div className="mt-6 p-4 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground font-semibold mb-2">Demo Accounts:</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p>• rahul.sharma@company.com (Employee)</p>
                            <p>• priya.patel@company.com (L1 Admin)</p>
                            <p>• amit.kumar@company.com (L2 Admin)</p>
                            <p>• sneha.reddy@company.com (L3 Admin)</p>
                            <p>• vikram.singh@company.com (L4 Admin)</p>
                            <p className="mt-2 italic">Password: any value</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
