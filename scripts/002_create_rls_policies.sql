-- Users table policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Scripts table policies (admins can create/update/delete, all can read)
CREATE POLICY "Anyone can view scripts" ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Admins can insert scripts" ON public.scripts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update scripts" ON public.scripts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete scripts" ON public.scripts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Products table policies
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Messages table policies
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Admins can create messages" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Quiz table policies
CREATE POLICY "Anyone can view quiz" ON public.quiz FOR SELECT USING (true);
CREATE POLICY "Admins can manage quiz" ON public.quiz FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Quiz responses policies
CREATE POLICY "Users can view their own responses" ON public.quiz_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own responses" ON public.quiz_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all responses" ON public.quiz_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Chat messages policies
CREATE POLICY "Users can view their own chats" ON public.chat_messages FOR SELECT USING (
  auth.uid() = operator_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = operator_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update their messages read status" ON public.chat_messages FOR UPDATE USING (
  auth.uid() = operator_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Trainings policies
CREATE POLICY "Anyone can view trainings" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "Admins can manage trainings" ON public.trainings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Training views policies
CREATE POLICY "Users can view their own training views" ON public.training_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark trainings as viewed" ON public.training_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all training views" ON public.training_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Attendance sessions policies
CREATE POLICY "Users can view their own sessions" ON public.attendance_sessions FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Users can create their own sessions" ON public.attendance_sessions FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Users can update their own sessions" ON public.attendance_sessions FOR UPDATE USING (auth.uid() = operator_id);
CREATE POLICY "Admins can view all sessions" ON public.attendance_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Phraseology policies
CREATE POLICY "Anyone can view phraseology" ON public.phraseology FOR SELECT USING (true);
CREATE POLICY "Admins can manage phraseology" ON public.phraseology FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Attendance types policies
CREATE POLICY "Anyone can view attendance types" ON public.attendance_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage attendance types" ON public.attendance_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
