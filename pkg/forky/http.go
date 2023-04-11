package forky

import (
	"net/http"
)

func wrapHandler(h http.Handler, fs http.FileSystem) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		nfrw := &NotFoundRedirectRespWr{ResponseWriter: w}

		h.ServeHTTP(nfrw, r)

		if nfrw.status == 404 {
			r.URL.Path = "/"

			w.Header().Set("Content-Type", "text/html")

			http.FileServer(fs).ServeHTTP(w, r)
		}
	}
}

type NotFoundRedirectRespWr struct {
	http.ResponseWriter
	status int
}

func (w *NotFoundRedirectRespWr) WriteHeader(status int) {
	w.status = status

	if status != http.StatusNotFound {
		w.ResponseWriter.WriteHeader(status)
	}
}

func (w *NotFoundRedirectRespWr) Write(p []byte) (int, error) {
	if w.status != http.StatusNotFound {
		return w.ResponseWriter.Write(p)
	}

	return len(p), nil
}
