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

   def event_router data
    unless @event["eventType"].nil?
      case @event["eventType"]
      when "question"
        data = data.upcase.gsub("\r\n", "")
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
    if name.to_s.empty?
      send_data "Please enter User Name or 'New'\n"
      prompt("Login: ", :login)
    else 
      user = User.find_by(name: name)
      if user.nil?
        send_data "Username not found\n"
        prompt("Login: ", :login)
      end
    end
   end
   
end

# Note that this will block current thread.
puts "Starting BBS"
EventMachine.run {
  EventMachine.start_server "127.0.0.1", 8080, BBSServer
}
puts "Stopping BBS"