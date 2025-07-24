-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dorm TEXT,
  wing TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  image_url TEXT,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events (public read access)
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

-- Create user_events junction table for event signups
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  signed_up_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on user_events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user_events
CREATE POLICY "Users can view their own event signups" 
ON public.user_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can sign up for events" 
ON public.user_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their event signups" 
ON public.user_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, dorm, wing)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'dorm',
    NEW.raw_user_meta_data ->> 'wing'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample events
INSERT INTO public.events (title, description, date, location, image_url, max_participants) VALUES
('Community Garden Cleanup', 'Help maintain our beautiful community garden. Bring gloves and enthusiasm!', '2024-02-15 14:00:00+00', 'Taylor University Community Garden', '/api/placeholder/400/300', 20),
('Food Drive Collection', 'Collect non-perishable food items for local families in need.', '2024-02-20 10:00:00+00', 'Student Union Building', '/api/placeholder/400/300', 50),
('Tutoring Program', 'Volunteer to tutor elementary students in math and reading.', '2024-02-22 16:00:00+00', 'Local Elementary School', '/api/placeholder/400/300', 15),
('Beach Cleanup Day', 'Join us for a day of environmental stewardship at the local beach.', '2024-02-25 09:00:00+00', 'Lake Shore Drive', '/api/placeholder/400/300', 30),
('Senior Center Visit', 'Spend time with seniors, play games, and share stories.', '2024-02-28 13:00:00+00', 'Upland Senior Center', '/api/placeholder/400/300', 25),
('Habitat for Humanity Build', 'Help build homes for families in our community.', '2024-03-05 08:00:00+00', 'Construction Site - Maple Street', '/api/placeholder/400/300', 40);