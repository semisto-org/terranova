# frozen_string_literal: true

# Amazon SES V2 configuration for transactional emails.
#
# Required environment variables in production:
#   AWS_SES_ACCESS_KEY_ID     — IAM access key with SES send permissions
#   AWS_SES_SECRET_ACCESS_KEY — Corresponding secret key
#   AWS_SES_REGION            — SES region (default: "eu-west-1")
#
# The :ses_v2 delivery method is provided by the aws-actionmailer-ses gem
# and uses the SESV2 API via aws-sdk-sesv2.
#
# In development, emails are opened in the browser via letter_opener.
# In test, emails are collected in ActionMailer::Base.deliveries.
