 require 'eventmachine'
 require 'active_record'
 require_relative './../models/user'
 require_relative './../models/message_board'
 require_relative './../models/message'
 require 'dotenv'

 db_configuration_file_path = './db/config.yml'
 db_configuration = YAML.load(File.read(db_configuration_file_path))
 
 Dotenv.load
 ActiveRecord::Base.establish_connection(db_configuration["development"])