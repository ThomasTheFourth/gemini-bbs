require_relative './bootstrap.rb'

 module BBSServer
   
   def post_init
     puts "Inbound connection"
     @event = {}
     @username = ""
     @password = ""
     @message_board = nil
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
        new_user
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
      new_password
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

   def main_menu(command = nil)
    if command.nil?
      send_data "\n"
      send_data "Main Menu:\n"
      send_data "(M)essage Boards\n"
      send_data "(G)oodbye\n"
      prompt("Command: ", :main_menu)
    else
      case command.upcase
        when "M"
          message_menu
        when "G"
          send_data "Goodbye\n"
          close_connection
        else
          send_data "Unrecognized Command\n"
          main_menu
      end
    end
  end

  def list_message_boards(command = nil)
    message_boards = MessageBoard.all
    if command.nil?
      send_data "\n"
      send_data "Message Boards:\n"
      message_boards.each_with_index do |board, index|
        send_data "(#{index + 1}) #{board.name}\n"
      end
      prompt("Select Active Message Board: ", :list_message_boards)
    elsif (is_numeric(command))
      @message_board = message_boards[command.to_i - 1]
      message_menu
    end

  end

  def list_messages(command = nil)
    messages = Message.where(message_board: @message_board)
    if command.nil?
      send_data "\n"
      messages.each_with_index do |message, index|
        send_data "(#{index + 1}) #{message.title}\n"
      end
      prompt("Select Message or (Q)uit:", :list_messages)
    elsif (is_numeric(command))
      display_message(messages[command])
    elsif command.upcase === "Q"
      message_menu
    else
      send_data "Unrecognized Command\n"
      list_messages
    end
  end

  def message_menu(command = nil)
    if command.nil?
      send_data "\n"
      send_data "Message Board:\n"
      send_data "Current Board: #{@message_board.nil? ? "none" : @message_board.name}\n"
      send_data "(L)ist Boards\n"
      send_data "(R)ead Messages\n"
      send_data "(M)ain Menu\n"
      send_data "(G)oodbye\n"
      prompt("Command: ", :message_menu)
    else
      case command.upcase
        when "M"
          main_menu
        when "G"
          send_data "Goodbye\n"
          close_connection
        when "L"
          send_data "List Boards\n"
          list_message_boards
        when "R"
          send_data "Read Messages\n"
          list_messages
        else
          send_data "\nUnrecognized Command\n"
          message_menu
      end
    end
  end
end

def is_numeric(o)
  true if Integer(o) rescue false
end

puts "Starting BBS"
EventMachine.run {
  EventMachine.start_server "127.0.0.1", 8080, BBSServer
}
puts "Stopping BBS"
