FROM httpd:2.4

MAINTAINER Ferenc Vajda

RUN set -eux; \
    apt-get update -y; \
    apt-get install -y libcgi-pm-perl; \
    mkdir -p /var/www/i8085sim/

COPY ./conf/ /usr/local/apache2/conf/
COPY ./ /var/www/i8085sim/

RUN chmod 755 /var/www/i8085sim/*.cgi /var/www/i8085sim/*.pl

