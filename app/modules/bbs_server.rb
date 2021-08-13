 require 'eventmachine'
 require 'active_record'
 require_relative './../models/user'
 db_configuration_file_path = './db/config.yml'
 db_configuration = YAML.load(File.read(db_configuration_file_path))

 ActiveRecord::Base.establish_connection(db_configuration["development"])

 module BBSServer
   
   def post_init
     puts "Inbound connection"
     @event = {}
     @username = ""
     @password = ""
     welcome
   end

   def receive_data data
     event_router data
   end

   def prompt(text, callback)
    @event["eventType"] = "question"
    @event["eventTarget"] = callback
    send_data text
   end

   def unbind
     puts "User disconnected"
   end

   def event_router(data = nil)
    unless @event["eventType"].nil?
      case @event["eventType"]
      when "question"
        data = data.gsub("\r\n", "")
        self.send(@event["eventTarget"], data)
      end
    end
   end

   def welcome
    send_data "\nWelcome to..."
    send_data "\n
    ████████╗██╗  ██╗███████╗    ██████╗ ██╗     ███████╗███████╗██████╗ ██╗      █████╗ ███╗   ██╗██████╗ ███████╗
    ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██║     ██╔════╝██╔════╝██╔══██╗██║     ██╔══██╗████╗  ██║██╔══██╗██╔════╝
       ██║   ███████║█████╗      ██████╔╝██║     █████╗  █████╗  ██████╔╝██║     ███████║██╔██╗ ██║██║  ██║███████╗
       ██║   ██╔══██║██╔══╝      ██╔═══╝ ██║     ██╔══╝  ██╔══╝  ██╔══██╗██║     ██╔══██║██║╚██╗██║██║  ██║╚════██║
       ██║   ██║  ██║███████╗    ██║     ███████╗███████╗███████╗██████╔╝███████╗██║  ██║██║ ╚████║██████╔╝███████║
       ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚══════╝╚══════╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝\n\n"
    login
   end

   def login(name = nil)
    if name.to_s.upcase === "NEW"
      new_user
    elsif name.to_s.empty?
      send_data "Please enter User Name or 'New'\n"
      prompt("Login: ", :login)
    else 
      user = User.find_by(name: name)
      if user.nil?
        send_data "Username not found\n\n"
        prompt("Login: ", :login)
      else
        @username = name
        login_password
      end
    end
   end

   def login_password(password = nil)
    if password.to_s.empty?
      prompt("Password: ", :login_password)
    else 
      user = User.find_by(name: @username, password: password)
      if user.nil?
        send_data "Invalid login\n\n"
        login
      else
        main_menu
      end
    end
   end


   def new_user(name = nil)
    if name.nil?
      prompt("Username: ", :new_user)
    elsif name.to_s.empty?
      send_data "Username cannot be blank\n"
      prompt("Username: ", :new_user)
    else 
      user = User.find_by(name: name)
      if user
        send_data "Username is already taken\n\n"
        prompt("Username: ", :new_user)
      else
        @username = name
        new_password
      end
    end
  end

  def new_password(password = nil)
    if password.nil?
      prompt("New Password: ", :new_password)
    elsif password.to_s.empty?
      send_data "Password cannot be blank\n"
      prompt("Password: ", :new_password)
    else 
        @password = password
        new_password_confirmation
      end
    end

   def new_password_confirmation(password = nil)
    if password.nil?
      prompt("Confirm Password: ", :new_password_confirmation)
    elsif password != @password
      send_data "Passwords do not match\n"
      new_password
    else 
        User.create(name: @username, password: @password)
        main_menu
      end
    end

   def main_menu
    send_data "\n"
    send_data "Main Menu:\n"
    send_data "(M)essage Boards\n"
    send_data "(G)oodbye\n"
   end
   
end

puts "Starting BBS"
EventMachine.run {
  EventMachine.start_server "127.0.0.1", 8080, BBSServer
}
puts "Stopping BBS"
