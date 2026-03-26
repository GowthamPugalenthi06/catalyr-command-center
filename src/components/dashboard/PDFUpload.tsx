import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFUploadProps {
    onUploadComplete: (data: { companyName: string; chunksCreated: number; textPreview: string; pages: number }) => void;
}

const API_URL = '/api/onboarding';

export function PDFUpload({ onUploadComplete }: PDFUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError('');

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type === 'text/plain')) {
            setFile(droppedFile);
        } else {
            setError('Please upload a PDF or TXT file');
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        const selectedFile = e.target.files?.[0];
        if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
            setFile(selectedFile);
        } else {
            setError('Please upload a PDF or TXT file');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a PDF or TXT file');
            return;
        }
        if (!companyName.trim()) {
            setError('Please enter your company name');
            return;
        }

        setUploading(true);
        setError('');
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('companyName', companyName);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 15, 85));
            }, 300);

            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            setProgress(100);
            const data = await res.json();
            onUploadComplete(data);
        } catch (err: any) {
            setError(err.message || 'Failed to upload document');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Company Name Input */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Name</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
            </div>

            {/* Drop Zone */}
            <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : file
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('pdf-input')?.click()}
            >
                <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {file ? (
                    <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10">
                            <FileText className="w-7 h-7 text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drop to replace
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                            <Upload className="w-7 h-7 text-primary" />
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                            {isDragging ? 'Drop your Document here' : 'Upload Company Document'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Drag & drop a PDF/TXT or click to browse • Max 10MB
                        </p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {uploading && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing document...
                        </span>
                        <span className="text-primary font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Upload Button */}
            <Button
                onClick={handleUpload}
                disabled={!file || !companyName.trim() || uploading}
                className="w-full py-6 text-lg font-medium shadow-lg shadow-primary/25 rounded-xl"
            >
                {uploading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Extracting & Training...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Upload & Extract Knowledge
                    </span>
                )}
            </Button>
        </div>
    );
}
