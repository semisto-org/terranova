Rails.application.config.after_initialize do
  Plants::Vds.load!
end
