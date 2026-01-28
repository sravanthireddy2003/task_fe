// Centralized icon exports for the Task Manager frontend
// Only import icons from this file for consistency


// Centralized icon exports for the Task Manager frontend
// Always import icons from this module for consistency

// Import specific icons needed for aliasing
import {
	Check,
	Clock3,
	RefreshCw,
	AlertCircle,
	Calendar,
	Clock,
	User,
	Plus,
	CheckSquare,
	Eye,
	Filter,
	Lock,
	UserCheck,
	AlertTriangle,
	ChevronDown,
	Search,
	Settings,
	MessageCircle,
	Users,
	CheckCircle,
	MoreVertical,
} from 'lucide-react';

// Re-export all Lucide icons so they can be imported from here
export * from 'lucide-react';
// Keep a couple of tiny aliases if older names are used elsewhere
export const CheckCheck = Check;
export const Clock4 = Clock3;
// Explicit convenient re-exports used across the app
export { RefreshCw, AlertCircle, Calendar, Clock, User, Plus, CheckSquare, Eye, Filter, Lock, UserCheck, AlertTriangle, ChevronDown, Search, Settings, MessageCircle, Users, CheckCircle, MoreVertical };

