# i8085sim - a Processor Simulator for i8085

_2007-2014_

`i8085sim` has been created as a practicing tool for Budapest University of Technology and Economics
electrical engineering students.  This help has been created for them: [Hungarian help](README-hu).

Technology has not been updated since 2007, so forgive me for this :).

## Installing on a Linux Server (or WSL)

To run this application, you need an Apache2 webserver with CGI enabled (mod\_cgi or mod\_cgid).
Root directory of i8085sim has to be CGI enabled.

Possible httpd.conf configuration.

    ...
    LoadModule cgi_module modules/mod_cgi.so
    ...
    DocumentRoot "/var/www/i8085sim"
    <Directory "/var/www/i8085sim">
        AllowOverride None
        Options +ExecCGI
        AddHandler cgi-script .cgi .pl
        Require all granted
    </Directory>

In case of Debian/Ubuntu, CGI module can be enabled from shell as follows:

    a2enmod cgi

## Using docker module

If you have docker installed on your _Linux_ computer (desktop, laptop, server...), using the
following command i8085sim starts to run and will be available at port 8089.

    docker run -d -p 8080:80 fercsi/i8085sim
